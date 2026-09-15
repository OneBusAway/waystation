<script>
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as t from '$lib/paraglide/messages.js';
	import AlertBadge from '$components/board/alert-badge.svelte';
	import ClockBlock from '$components/board/clock-block.svelte';
	import DepartureRow from '$components/board/departure-row.svelte';
	import EmptyBoard from '$components/board/empty-board.svelte';
	import Legend from '$components/board/legend.svelte';
	import LiveDot from '$components/board/live-dot.svelte';

	const STALE_THRESHOLD_MS = 90_000;

	let {
		agencyName = '',
		agencyLogo = '',
		stopId = '',
		stopName = '',
		stopSubtitle = '',
		arrivals = [],
		alert = null,
		now,
		lastUpdatedAt = null,
		isStale = false,
		fetchFailed = false,
		failedStopIds = [],
		showStopName = false,
		rowCount = 5,
		showFooter = true,
		showAlerts = true,
		showOccupancyStatus = false
	} = $props();

	const visible = $derived(arrivals.slice(0, rowCount));
	const emptyCount = $derived(Math.max(0, rowCount - visible.length));
	const hasAlert = $derived(showAlerts && !!alert);
	const liveCount = $derived(arrivals.filter((a) => a.delta != null).length);
	const updatedDate = $derived(lastUpdatedAt ? new Date(lastUpdatedAt) : null);
	const ageMs = $derived(updatedDate ? now.getTime() - updatedDate.getTime() : null);
	const stale = $derived(isStale || (ageMs != null && ageMs > STALE_THRESHOLD_MS));
	const showLive = $derived(liveCount > 0 && !stale);
	const emptyMode = $derived.by(() => {
		if (updatedDate) return stale ? 'stale' : 'empty';
		return fetchFailed ? 'error' : 'connecting';
	});
	const showFailedBadge = $derived(failedStopIds.length > 0);
</script>

<div
	style:position="absolute"
	style:inset="0"
	style:background="var(--bg)"
	style:color="var(--ink)"
	style:padding="28px 32px 24px"
	style:display="grid"
	style:grid-template-rows="118px auto 56px 1fr auto"
	style:gap="16px"
	style:z-index="1"
>
	<!-- HEADER -->
	<header
		style:display="grid"
		style:grid-template-columns="auto 1fr auto"
		style:align-items="center"
		style:border-bottom="2px solid var(--rule-strong)"
		style:padding-bottom="18px"
	>
		<div style:display="flex" style:align-items="center" style:gap="20px">
			{#if agencyLogo}
				<img
					src={agencyLogo}
					alt={agencyName}
					style:height="64px"
					style:width="auto"
					style:object-fit="contain"
				/>
			{/if}
			{#if agencyName}
				<span
					style:font-family="'IBM Plex Sans', sans-serif"
					style:font-weight="700"
					style:font-size="22px"
					style:color="var(--ink)"
					style:letter-spacing="0.01em"
				>
					{agencyName}
				</span>
			{/if}
		</div>

		<div style:display="flex" style:justify-content="center">
			<div
				class="sc display"
				style:font-weight="800"
				style:font-size="32px"
				style:letter-spacing="0.24em"
				style:color="var(--ink-dim)"
			>
				{t.board_departures()}
			</div>
		</div>

		<ClockBlock {now} />
	</header>

	<!-- STOP IDENTITY -->
	<section
		style:display="grid"
		style:grid-template-columns={hasAlert ? '1fr auto' : '1fr'}
		style:align-items="end"
		style:gap="24px"
		style:padding-top="4px"
	>
		<div>
			<div
				class="sc"
				style:font-size="18px"
				style:letter-spacing="0.22em"
				style:color="var(--ink-mute)"
				style:margin-bottom="6px"
			>
				{t.board_stop_label({ stopId })}
			</div>
			<div
				class="display"
				style:font-size="56px"
				style:font-weight="700"
				style:line-height="1"
				style:letter-spacing="-0.01em"
				style:white-space="nowrap"
				style:overflow="hidden"
				style:text-overflow="ellipsis"
			>
				{stopName}{#if stopSubtitle}<span style:color="var(--ink-dim)" style:font-weight="400">
						· {stopSubtitle}</span
					>{/if}
			</div>
		</div>

		{#if hasAlert}
			<AlertBadge situation={alert} />
		{/if}

		{#if showFailedBadge}
			<div
				class="sc"
				style:grid-column="1 / -1"
				style:display="inline-flex"
				style:align-items="center"
				style:gap="12px"
				style:margin-top="12px"
				style:padding="10px 18px"
				style:border="1px solid var(--late)"
				style:border-left="4px solid var(--late)"
				style:border-radius="2px"
				style:background="color-mix(in srgb, var(--late) 6%, transparent)"
				style:font-size="20px"
				style:letter-spacing="0.18em"
				style:color="var(--late)"
				style:font-weight="700"
			>
				<span>
					{failedStopIds.length > 1
						? t.board_data_unavailable_stops()
						: t.board_data_unavailable_stop()}
					{failedStopIds.map((id) => '#' + (id.split('_')[1] ?? id)).join(', ')}
				</span>
			</div>
		{/if}
	</section>

	<!-- COLUMN HEADER -->
	<div
		class="sc tnum"
		style:display="grid"
		style:grid-template-columns="200px 1fr 380px 380px"
		style:align-items="center"
		style:gap="24px"
		style:font-size="16px"
		style:letter-spacing="0.22em"
		style:color="var(--ink-mute)"
		style:border-top="1px solid var(--rule)"
		style:border-bottom="1px solid var(--rule)"
		style:padding="14px 8px"
	>
		<div>{t.board_col_route()}</div>
		<div>{t.board_col_destination()}</div>
		<div style:text-align="right">{t.board_col_arrives()}</div>
		<div style:text-align="right">{t.board_col_status()}</div>
	</div>

	<!-- ROWS -->
	{#if visible.length === 0}
		<EmptyBoard mode={emptyMode} {rowCount} />
	{:else}
		<div
			style:display="grid"
			style:grid-template-rows="repeat({rowCount}, 1fr)"
			style:gap="6px"
			style:min-height="0"
		>
			{#each visible as arrival (arrival.tripId ?? `${arrival.route}-${arrival.departureAt}`)}
				<DepartureRow {arrival} {showStopName} {showOccupancyStatus} />
			{/each}
			{#each Array.from({ length: emptyCount }, (_, i) => i) as i (i)}
				<div style:border-bottom="1px dashed var(--rule)"></div>
			{/each}
		</div>
	{/if}

	<!-- FOOTER -->
	{#if showFooter}
		<footer
			style:display="grid"
			style:grid-template-columns="auto 1fr auto"
			style:align-items="center"
			style:gap="32px"
			style:border-top="1px solid var(--rule)"
			style:padding-top="14px"
			style:font-size="18px"
		>
			<div
				class="sc"
				style:font-size="15px"
				style:letter-spacing="0.18em"
				style:color="var(--ink-mute)"
			>
				<span style:color="var(--ink-dim)" style:font-weight="600">{t.board_waystation()}</span>
				<span style:margin="0 12px" style:color="var(--rule-strong)">/</span>
				<span>{t.board_otsf()}</span>
			</div>

			<Legend />

			<div style:display="flex" style:align-items="center" style:gap="22px">
				<LiveDot hasRealtime={showLive} />
				<span
					class="sc tnum"
					style:font-size="15px"
					style:letter-spacing="0.14em"
					style:color={stale ? 'var(--late)' : 'var(--ink-mute)'}
					style:font-weight={stale ? 700 : 400}
				>
					{#if !updatedDate}
						{t.board_updating()}
					{:else if stale}
						{t.board_stale_prefix()}
						{updatedDate.toLocaleTimeString(getLocale(), {
							hour: 'numeric',
							minute: '2-digit',
							second: '2-digit'
						})}
					{:else}
						{t.board_updated()}
						{updatedDate.toLocaleTimeString(getLocale(), {
							hour: 'numeric',
							minute: '2-digit',
							second: '2-digit'
						})}
					{/if}
				</span>
			</div>
		</footer>
	{/if}
</div>
