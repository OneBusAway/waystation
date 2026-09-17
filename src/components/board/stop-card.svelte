<script>
	import * as t from '$lib/paraglide/messages.js';
	import { splitStopName } from '$lib/formatters.js';
	import { COLLAPSED_CARD_HEIGHT } from '$lib/board-layout.js';
	import StopRow from '$components/board/stop-row.svelte';

	let { stop, limit = 4, rowHeight = 64, numeralSize = 48, showCrowding = false } = $props();

	const rows = $derived(stop.failed ? [] : stop.arrivals.slice(0, limit));
	// A failed stop can still hold last-good arrivals, but the card has always given the
	// failure precedence over them; that behaviour is preserved here.
	const collapsed = $derived(stop.failed || rows.length === 0);

	const title = $derived(splitStopName(stop.name));
	const direction = $derived.by(() => {
		const key = `board_dir_${String(stop.direction ?? '').toUpperCase()}`;
		return key in t ? t[key]() : '';
	});

	const meta = $derived(
		[t.board_stop_code({ stopId: stop.code }), title.bay, direction].filter(Boolean)
	);
	const collapsedLabel = $derived([title.name, title.bay, direction].filter(Boolean).join(' · '));
	const collapsedMessage = $derived(
		stop.failed ? t.board_data_unavailable() : t.board_no_departures_inline()
	);
</script>

{#if collapsed}
	<!-- One line on the cream ground: still present so a rider knows the stop is watched,
	     but never taking a full card in a prime position. -->
	<section
		style:display="flex"
		style:align-items="center"
		style:align-self="start"
		style:min-width="0"
		style:height="{COLLAPSED_CARD_HEIGHT}px"
		style:padding="0 20px"
		style:background="transparent"
		style:border="1px solid var(--card-edge)"
		style:border-radius="var(--radius-container)"
		style:opacity={stop.failed ? 1 : 0.4}
	>
		<span
			class="display"
			style:font-size="22px"
			style:font-weight="600"
			style:white-space="nowrap"
			style:overflow="hidden"
			style:text-overflow="ellipsis"
			style:color={stop.failed ? 'var(--late)' : 'var(--ink)'}
		>
			{collapsedLabel} — {collapsedMessage}
		</span>
	</section>
{:else}
	<section
		style:display="grid"
		style:grid-template-rows="auto auto"
		style:align-self="start"
		style:min-height="0"
		style:background="var(--bg-elev)"
		style:border="1px solid var(--card-edge)"
		style:border-radius="var(--radius-container)"
		style:padding="16px 20px 10px"
	>
		<div style:padding-bottom="10px" style:border-bottom="1px solid var(--rule)">
			<div
				data-testid="stop-title"
				class="display"
				style:font-size="36px"
				style:font-weight="700"
				style:line-height="1.12"
				style:white-space="nowrap"
				style:overflow="hidden"
				style:text-overflow="ellipsis"
			>
				{title.name}
			</div>
			<div
				data-testid="stop-meta"
				class="sc tnum"
				style:font-size="13px"
				style:letter-spacing="0.10em"
				style:color="var(--ink-mute)"
				style:margin-top="6px"
				style:white-space="nowrap"
				style:overflow="hidden"
				style:text-overflow="ellipsis"
			>
				{#each meta as part, i (i)}{#if i > 0}<span
							style:margin="0 8px"
							style:color="var(--rule-strong)">·</span
						>{/if}{part}{/each}
			</div>
		</div>

		<div style:display="grid" style:min-height="0">
			{#each rows as arrival, i (arrival.tripId ?? `${arrival.route}-${arrival.departureAt}`)}
				<StopRow {arrival} {rowHeight} {numeralSize} {showCrowding} last={i === rows.length - 1} />
			{/each}
		</div>
	</section>
{/if}
