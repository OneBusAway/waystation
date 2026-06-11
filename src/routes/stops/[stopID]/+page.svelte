<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';

	import Board from '$components/board/board.svelte';
	import {
		formatBoardDeparture,
		parseStopDepartures,
		removeDuplicates,
		sortEarliestDepartures
	} from '$lib/formatters.js';

	let { data } = $props();

	const theme = 'dark';
	const showStopName = data.stopIDs.length > 1;
	const ALERT_ROTATE_MS = 8000;

	let now = $state(new Date());
	let arrivals = $state([]);
	let situations = $state([]);
	let alertIndex = $state(0);
	let stopId = $state('');
	let stopName = $state('');
	let lastUpdatedAt = $state(null);
	let isStale = $state(false);

	const activeAlert = $derived(
		situations.length > 0 ? situations[alertIndex % situations.length] : null
	);

	let clockTimer;
	let fetchTimer;
	let alertTimer;
	let cancelled = false;
	let fetchInFlight = false;
	let refreshIntervalMs = 30_000;
	let maxDepartures = $state(5);

	async function fetchStop(id) {
		const response = await fetch(`/api/oba/arrivals-and-departures-for-stop/${id}`);
		if (!response.ok) throw new Error(`HTTP ${response.status} for stop ${id}`);
		const json = await response.json();

		// Upstream OBA returns `null` (HTTP 200) for some valid stops with no
		// real-time data; parseStopDepartures normalizes that into an empty result
		// rather than throwing, so the board shows an empty state instead of failing.
		return parseStopDepartures(json, id);
	}

	async function fetchAll() {
		if (fetchInFlight) return;
		fetchInFlight = true;
		try {
			const ids = data.stopIDs;
			const settled = await Promise.allSettled(ids.map(fetchStop));
			const fulfilled = [];
			settled.forEach((r, i) => {
				if (r.status === 'fulfilled') fulfilled.push(r.value);
				else console.error(`Board fetch failed for stop ${ids[i]}:`, r.reason);
			});

			if (fulfilled.length === 0) return;

			const fetchNow = new Date();
			const all = fulfilled.flatMap((r) => r.departures);
			const mapped = sortEarliestDepartures(removeDuplicates(all))
				.map((dep) => formatBoardDeparture(dep, fetchNow))
				.filter((a) => a.min >= -2);

			arrivals = mapped;
			situations = fulfilled.flatMap((r) => r.situations).filter((s) => s?.summary?.value);
			isStale = fulfilled.some((r) => r.stale);

			const primary = fulfilled[0];
			stopId = primary.stopId.split('_')[1] ?? primary.stopId;
			stopName = primary.stopName;
			lastUpdatedAt = fetchNow.getTime();
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
		document.body.classList.add('board-body');

		try {
			const res = await fetch('/api/config');
			if (!res.ok) throw new Error(`/api/config returned ${res.status}`);
			const config = await res.json();
			refreshIntervalMs = (Number(config.updateInterval) || 30) * 1000;
			const parsedMax = Math.floor(Number(config.maxDepartures));
			maxDepartures = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 5;
		} catch (err) {
			console.error('Config fetch failed; using defaults (30s refresh, 5 departures):', err);
		}

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
			document.body.classList.remove('board-body');
			window.removeEventListener('resize', fitStage);
		}
		clearInterval(clockTimer);
		clearInterval(fetchTimer);
		clearInterval(alertTimer);
	});
</script>

<div class="board-stage-wrap">
	<div id="board-stage" class="board-stage theme-departure theme-{theme}">
		<Board
			agencyName={PUBLIC_OBA_REGION_NAME}
			agencyLogo={PUBLIC_OBA_LOGO_URL}
			{stopId}
			{stopName}
			{arrivals}
			alert={activeAlert}
			{now}
			{lastUpdatedAt}
			{isStale}
			{showStopName}
			rowCount={Math.min(maxDepartures, 5)}
		/>
	</div>
</div>
