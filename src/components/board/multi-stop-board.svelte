<script>
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as t from '$lib/paraglide/messages.js';
	import AlertBand from '$components/board/alert-band.svelte';
	import ClockBlock from '$components/board/clock-block.svelte';
	import Legend from '$components/board/legend.svelte';
	import LiveDot from '$components/board/live-dot.svelte';
	import StopCard from '$components/board/stop-card.svelte';
	import {
		ALERT_HEIGHT,
		CARD_GAP,
		FOOTER_HEIGHT,
		HEADER_HEIGHT,
		PAD_BOTTOM,
		PAD_TOP,
		PAD_X,
		cardWidth,
		columnRuleOffsets,
		computeGridLayout,
		SECTION_GAP
	} from '$lib/board-layout.js';

	const STALE_THRESHOLD_MS = 90_000;

	let {
		agencyName = '',
		agencyLogo = '',
		stops = [],
		alert = null,
		now,
		lastUpdatedAt = null,
		isStale = false,
		maxDepartures = 6,
		showFooter = true,
		showAlerts = true
	} = $props();

	// Stops with departures come first; an empty or failed stop collapses to one line at the
	// back rather than taking a prime position at full card height.
	const isEmpty = (s) => s.failed || s.arrivals.length === 0;
	// Array.prototype.sort is stable, so the configured order survives inside each group.
	const ordered = $derived([...stops].sort((a, b) => Number(isEmpty(a)) - Number(isEmpty(b))));
	const rowCounts = $derived(ordered.map((s) => (s.failed ? 0 : s.arrivals.length)));

	const hasAlert = $derived(showAlerts && !!alert);

	// Every dimension of the 1920×1080 stage is known, so the grid is solved rather than
	// measured: leftover height is spent on row height and numeral size (punch list §1).
	const layout = $derived(computeGridLayout({ rowCounts, maxDepartures, hasAlert, showFooter }));
	const templateRows = $derived(
		[
			`${HEADER_HEIGHT}px`,
			'1fr',
			hasAlert ? `${ALERT_HEIGHT}px` : null,
			showFooter ? `${FOOTER_HEIGHT}px` : null
		]
			.filter(Boolean)
			.join(' ')
	);
	// Columns and the 1px rule in each gap are both solved from the fixed stage width, so the
	// rule lands exactly between columns at both 2 and 3 columns.
	const colWidth = $derived(cardWidth(layout.cols));
	const ruleOffsets = $derived(columnRuleOffsets(layout.cols));
	const liveCount = $derived(
		stops.reduce((c, s) => c + s.arrivals.filter((a) => a.delta != null).length, 0)
	);
	const updatedDate = $derived(lastUpdatedAt ? new Date(lastUpdatedAt) : null);
	const updatedLabel = $derived(
		updatedDate
			? updatedDate.toLocaleTimeString(getLocale(), {
					hour: 'numeric',
					minute: '2-digit',
					second: '2-digit'
				})
			: ''
	);
	const ageMs = $derived(updatedDate ? now.getTime() - updatedDate.getTime() : null);
	const stale = $derived(isStale || (ageMs != null && ageMs > STALE_THRESHOLD_MS));
	const showLive = $derived(liveCount > 0 && !stale);
</script>

<div
	style:position="absolute"
	style:inset="0"
	style:background="var(--bg)"
	style:color="var(--ink)"
	style:padding="{PAD_TOP}px {PAD_X}px {PAD_BOTTOM}px"
	style:display="grid"
	style:grid-template-rows={templateRows}
	style:gap="{SECTION_GAP}px"
	style:z-index="1"
>
	<!-- HEADER -->
	<header
		style:display="grid"
		style:grid-template-columns="auto 1fr auto"
		style:align-items="center"
		style:border-bottom="2px solid var(--rule-strong)"
		style:padding-bottom="16px"
	>
		<div style:display="flex" style:align-items="center" style:gap="24px">
			{#if agencyLogo}
				<img
					src={agencyLogo}
					alt={agencyName}
					style:height="58px"
					style:width="auto"
					style:object-fit="contain"
				/>
			{/if}
			{#if agencyLogo && agencyName}
				<div
					data-testid="lockup-divider"
					aria-hidden="true"
					style:width="1px"
					style:height="44px"
					style:background="var(--rule)"
				></div>
			{/if}
			{#if agencyName}
				<div
					class="display"
					style:font-size="30px"
					style:font-weight="700"
					style:line-height="1.05"
				>
					{agencyName}
				</div>
			{/if}
		</div>

		<div style:display="flex" style:justify-content="center">
			<div
				class="sc display"
				style:font-weight="800"
				style:font-size="28px"
				style:letter-spacing="0.26em"
				style:color="var(--ink-dim)"
			>
				{t.board_departures()}
			</div>
		</div>

		<ClockBlock {now} />
	</header>

	<!-- STOP GRID -->
	<div
		style:position="relative"
		style:display="grid"
		style:grid-template-columns="repeat({layout.cols}, {colWidth}px)"
		style:grid-auto-rows="min-content"
		style:align-content="center"
		style:gap="{CARD_GAP}px"
		style:min-height="0"
	>
		{#each ruleOffsets as left, i (i)}
			<div
				data-testid="column-rule"
				aria-hidden="true"
				style:position="absolute"
				style:top="0"
				style:bottom="0"
				style:left="{left}px"
				style:width="1px"
				style:background="var(--rule)"
			></div>
		{/each}
		{#each ordered as stop (stop.id)}
			<StopCard
				{stop}
				limit={layout.perCard}
				rowHeight={layout.rowHeight}
				numeralSize={layout.numeralSize}
			/>
		{/each}
	</div>

	{#if hasAlert}
		<AlertBand situation={alert} />
	{/if}

	<!-- FOOTER -->
	{#if showFooter}
		<footer
			style:display="grid"
			style:grid-template-columns="auto 1fr auto"
			style:align-items="center"
			style:gap="32px"
			style:height="{FOOTER_HEIGHT}px"
			style:border-top="1px solid var(--rule)"
			style:padding-top="12px"
		>
			<div
				class="sc"
				style:font-size="14px"
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
					style:font-size="14px"
					style:letter-spacing="0.14em"
					style:color={stale ? 'var(--late)' : 'var(--ink-mute)'}
					style:font-weight={stale ? 700 : 400}
				>
					{#if !updatedDate}
						{t.board_updating()}
					{:else if stale}
						{t.board_stale_prefix()}
						{updatedLabel}
					{:else}
						{t.board_updated()}
						{updatedLabel}
					{/if}
				</span>
			</div>
		</footer>
	{/if}
</div>
