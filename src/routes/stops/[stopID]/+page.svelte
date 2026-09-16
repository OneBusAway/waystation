<script>
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';

	import Board from '$components/board/board.svelte';
	import MultiStopBoard from '$components/board/multi-stop-board.svelte';
	import {
		computeScreenWindow,
		diffArrivals,
		formatBoardDeparture,
		paginateArrivals,
		parseStopDepartures,
		removeDuplicates,
		sortEarliestDepartures
	} from '$lib/formatters.js';

	let { data } = $props();

	// Theme comes from admin config (server-loaded, so it's right on first paint): 'light',
	// 'dark', or 'system'. System follows the OS/browser color-scheme preference and updates
	// live; it defaults to dark during SSR and is corrected on mount.
	let systemTheme = $state('dark');
	let colorScheme;
	const applyColorScheme = () => (systemTheme = colorScheme?.matches ? 'light' : 'dark');
	const theme = $derived(data.config.theme === 'system' ? systemTheme : data.config.theme);
	const colorMode = $derived(data.config.colorMode);
	const ALERT_ROTATE_MS = 8000;

	const isMultiStop = $derived(data.stopIDs.length > 1);

	let now = $state(new Date());
	let stops = $state([]);
	let situations = $state([]);
	let alertIndex = $state(0);
	let lastUpdatedAt = $state(null);
	let isStale = $state(false);
	let fetchFailed = $state(false);
	let failedStopIds = $state([]);

	// The single-stop board reads the first (only) stop of the same per-stop model.
	const primary = $derived(stops[0]);

	const activeAlert = $derived(
		situations.length > 0 ? situations[alertIndex % situations.length] : null
	);

	let clockTimer;
	let fetchTimer;
	let alertTimer;
	let cancelled = false;
	let fetchInFlight = false;
	const refreshIntervalMs = $derived(data.config.updateInterval * 1000);
	const maxDepartures = $derived(data.config.maxDepartures);

	// Multi-screen pagination: slices this stop's departures for `data.screen`
	// of `data.screens`. `count` also drives Board's rowCount below, so slicing
	// and rendering never disagree.
	const screenWindow = $derived(computeScreenWindow(maxDepartures, data.screen, data.screens));
	const pagedArrivals = $derived(
		paginateArrivals(primary?.arrivals ?? [], screenWindow.start, screenWindow.count)
	);

	async function fetchStop(id) {
		const response = await fetch(`/api/oba/arrivals-and-departures-for-stop/${id}`);
		if (!response.ok) throw new Error(`HTTP ${response.status} for stop ${id}`);
		const json = await response.json();

		// Upstream OBA returns `null` (HTTP 200) for some valid stops with no
		// real-time data; parseStopDepartures normalizes that into an empty result
		// rather than throwing, so the board shows an empty state instead of failing.
		return parseStopDepartures(json, id);
	}

	function toBoardArrivals(departures, fetchNow) {
		return sortEarliestDepartures(removeDuplicates(departures))
			.map((dep) => formatBoardDeparture(dep, fetchNow))
			.filter((a) => a.min >= -2);
	}

	async function fetchAll() {
		if (fetchInFlight) return;
		fetchInFlight = true;
		try {
			const ids = data.stopIDs;
			const settled = await Promise.allSettled(ids.map(fetchStop));
			const fetchNow = new Date();
			const prevById = new Map(stops.map((s) => [s.id, s]));
			const fulfilled = [];
			const failed = [];

			stops = settled.map((r, i) => {
				const id = ids[i];
				const prev = prevById.get(id);
				if (r.status !== 'fulfilled') {
					console.error(`Board fetch failed for stop ${id}:`, r.reason);
					failed.push(id);
					// Keep the last-good rows (like the single-stop board always did) so a
					// transient blip does not wipe the card; the footer goes stale on its own.
					const fallback = parseStopDepartures(null, id);
					return {
						id,
						code: prev?.code ?? fallback.stopCode,
						name: prev?.name ?? fallback.stopName,
						direction: prev?.direction ?? fallback.direction,
						arrivals: prev?.arrivals ?? [],
						failed: true
					};
				}
				fulfilled.push(r.value);
				return {
					id,
					code: r.value.stopCode,
					name: r.value.stopName,
					direction: r.value.direction,
					arrivals: diffArrivals(
						prev?.arrivals ?? [],
						toBoardArrivals(r.value.departures, fetchNow)
					),
					failed: false
				};
			});
			failedStopIds = failed;

			if (fulfilled.length === 0) {
				if (lastUpdatedAt === null) fetchFailed = true;

				return;
			}

			const byId = new Map(fulfilled.flatMap((r) => r.situations).map((s) => [s?.id ?? s, s]));
			situations = [...byId.values()].filter((s) => s?.summary?.value);
			isStale = fulfilled.some((r) => r.stale);
			lastUpdatedAt = fetchNow.getTime();
			fetchFailed = false;
		} finally {
			fetchInFlight = false;
		}
	}

	function fitStage() {
		const stage = document.getElementById('board-stage');
		if (!stage) return;
		const w = window.innerWidth;
		const h = window.innerHeight;
		const scale = Math.min(w / 1920, h / 1080);
		const tx = (w - 1920 * scale) / 2;
		const ty = (h - 1080 * scale) / 2;
		stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
	}

	function safeTick() {
		fetchAll().catch((err) => console.error('fetchAll tick failed:', err));
	}

	onMount(async () => {
		colorScheme = window.matchMedia('(prefers-color-scheme: light)');
		applyColorScheme();
		colorScheme.addEventListener('change', applyColorScheme);

		await fetchAll().catch((err) => console.error('Initial fetchAll failed:', err));

		if (cancelled) return;

		fitStage();
		window.addEventListener('resize', fitStage);
		clockTimer = setInterval(() => (now = new Date()), 1000);
		fetchTimer = setInterval(safeTick, refreshIntervalMs);
		alertTimer = setInterval(() => {
			if (situations.length > 0) alertIndex = (alertIndex + 1) % situations.length;
		}, ALERT_ROTATE_MS);
	});

	onDestroy(() => {
		cancelled = true;
		if (browser) {
			window.removeEventListener('resize', fitStage);
			colorScheme?.removeEventListener('change', applyColorScheme);
		}
		clearInterval(clockTimer);
		clearInterval(fetchTimer);
		clearInterval(alertTimer);
	});
</script>

<div class="board-stage-wrap">
	<div id="board-stage" class="board-stage theme-departure theme-{theme} theme-{colorMode}">
		{#if isMultiStop}
			<MultiStopBoard
				agencyName={data.regionName}
				agencyLogo={data.logoUrl}
				{stops}
				alert={activeAlert}
				{now}
				{lastUpdatedAt}
				{isStale}
				{maxDepartures}
			/>
		{:else}
			<Board
				agencyName={data.regionName}
				agencyLogo={data.logoUrl}
				stopId={primary?.code ?? ''}
				stopName={primary?.name ?? ''}
				arrivals={pagedArrivals}
				alert={activeAlert}
				{now}
				{lastUpdatedAt}
				{isStale}
				{fetchFailed}
				{failedStopIds}
				rowCount={screenWindow.count}
			/>
		{/if}
	</div>
</div>
