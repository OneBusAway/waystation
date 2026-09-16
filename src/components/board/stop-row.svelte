<script>
	import * as t from '$lib/paraglide/messages.js';

	const STATUS = {
		ONTIME: { glyph: '●', weight: 500 },
		EARLY: { glyph: '▲', weight: 700 },
		LATE: { glyph: '▼', weight: 700 },
		CANCEL: { glyph: '✕', weight: 700 },
		SCHED: { glyph: '○', weight: 500 }
	};

	let { arrival, last = false, rowHeight = 64, numeralSize = 48 } = $props();

	const isCancel = $derived(arrival.status === 'CANCEL');
	const isNow = $derived(!isCancel && arrival.min <= 0);
	const s = $derived(STATUS[arrival.status] ?? STATUS.SCHED);

	// Which statuses say themselves in words lives here and nowhere else: an empty string means
	// the row stays silent, and the template renders the line only when there is one. The glyph
	// and the footer legend already carry "nothing is wrong", so ONTIME and SCHED say nothing;
	// CANCEL says nothing here either because the minutes column already renders CANCELED, and
	// printing it twice on one row is the duplication this whole change set out to remove.
	const phrase = $derived.by(() => {
		const { status, delta } = arrival;
		if (status === 'LATE' && delta != null) return t.board_status_min_late({ delta });
		if (status === 'EARLY' && delta != null)
			return t.board_status_min_early({ delta: Math.abs(delta) });
		if (status === 'EARLY') return t.board_status_early();
		if (status === 'LATE') return t.board_status_delayed();
		return '';
	});

	// Word routes ("2 Line", "B Line") get a content-sized pill; a fixed 104px tile around
	// two small words reads as a black blob. Numeric routes keep the fixed tile.
	const route = $derived(String(arrival.route ?? ''));
	const isWordRoute = $derived(/[a-z]/i.test(route) && route.includes(' '));
	const badgeHeight = $derived(Math.max(48, Math.min(64, rowHeight - 22)));
	const badgeWidth = $derived(Math.round(badgeHeight * 1.9));
	const numericScale = $derived(
		route.length <= 2 ? 0.62 : route.length <= 3 ? 0.54 : route.length <= 4 ? 0.42 : 0.36
	);
	const badgeFontSize = $derived(
		isWordRoute
			? Math.min(26, Math.round(badgeHeight * 0.4))
			: Math.round(badgeHeight * numericScale)
	);

	// Floor for the minutes column: fits a glyph, two digits and the MIN label (125px at
	// numeralSize: 48). Only a floor, because CANCELED is wider than it in every locale; the
	// track grows to max-content, taking the extra from the destination, which ellipsizes.
	// Right-aligned either way, so the numeral edge never moves.
	const minutesColumn = $derived(Math.round(numeralSize * 2.6));
	const glyphSize = $derived(Math.round(numeralSize * 0.32));
	const minLabelSize = $derived(Math.round(numeralSize * 0.33));
	const cancelSize = $derived(Math.round(numeralSize * 0.54));
	// Destination sits clearly below the 36px card title but grows a little with the row.
	const destSize = $derived(Math.min(28, Math.round(24 + (numeralSize - 48) * 0.25)));
</script>

<div
	class="status-{arrival.status}"
	style:display="grid"
	style:grid-template-columns="auto minmax(0, 1fr) minmax({minutesColumn}px, max-content)"
	style:gap="14px"
	style:align-items="center"
	style:height="{rowHeight}px"
	style:border-bottom={last ? 'none' : '1px solid var(--rule)'}
	style:opacity={isCancel ? 0.7 : 1}
>
	<div
		class="route-badge"
		style:width={isWordRoute ? 'auto' : `${badgeWidth}px`}
		style:min-width={isWordRoute ? `${badgeHeight}px` : null}
		style:padding={isWordRoute ? '0 12px' : null}
		style:height="{badgeHeight}px"
		style:border-radius="var(--radius-chip)"
		style:display="grid"
		style:place-items="center"
	>
		<div
			class="display tnum"
			style:font-size="{badgeFontSize}px"
			style:font-weight="800"
			style:line-height="1"
			style:letter-spacing="-0.01em"
			style:color="var(--badge-ink)"
			style:white-space="nowrap"
			style:max-width="{isWordRoute ? Math.round(badgeWidth * 1.5) : badgeWidth - 16}px"
			style:overflow="hidden"
			style:text-overflow="ellipsis"
		>
			{arrival.route}
		</div>
	</div>

	<div style:min-width="0">
		<div
			class="display"
			style:font-size="{destSize}px"
			style:font-weight="600"
			style:line-height="1.15"
			style:white-space="nowrap"
			style:overflow="hidden"
			style:text-overflow="ellipsis"
		>
			{arrival.dest || arrival.name}
		</div>
		{#if phrase}
			<div
				class="sc tnum"
				style:font-size="12px"
				style:letter-spacing="0.10em"
				style:margin-top="2px"
				style:color="var(--status-tone)"
				style:font-weight={s.weight}
			>
				{phrase}
			</div>
		{/if}
	</div>

	<!-- overflow: hidden is a backstop: it keeps a string too long for the card out of the next one. -->
	<div
		data-testid="minutes-group"
		dir="ltr"
		style:display="flex"
		style:align-items="baseline"
		style:gap="6px"
		style:justify-content="flex-end"
		style:overflow="hidden"
	>
		{#if !isNow}
			<span
				data-testid="status-glyph"
				aria-hidden="true"
				style:font-size="{glyphSize}px"
				style:color="var(--status-tone)"
				style:font-weight={s.weight}>{s.glyph}</span
			>
		{/if}
		{#if isCancel}
			<span
				data-testid="minutes"
				class="sc display"
				style:font-size="{cancelSize}px"
				style:font-weight="700"
				style:color="var(--status-tone)">{t.board_status_canceled()}</span
			>
		{:else if isNow}
			<span
				data-testid="minutes"
				class="sc display"
				style:font-size="{numeralSize}px"
				style:font-weight="800"
				style:line-height="0.9"
				style:letter-spacing="-0.01em"
				style:color="var(--accent)">{t.board_now()}</span
			>
		{:else}
			<span
				data-testid="minutes"
				class="display mono tnum"
				style:font-size="{numeralSize}px"
				style:font-weight="700"
				style:line-height="0.9"
				style:letter-spacing="-0.03em"
				style:color="var(--ink)">{arrival.min}</span
			>
			<span
				class="sc display"
				style:font-size="{minLabelSize}px"
				style:font-weight="700"
				style:letter-spacing="0.06em"
				style:color="var(--ink-mute)">{t.board_min()}</span
			>
		{/if}
	</div>
</div>
