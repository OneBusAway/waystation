<script>
	import * as t from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { formatTime } from '$lib/formatters.js';
	import ArrivalHero from '$components/board/arrival-hero.svelte';
	import RouteBadge from '$components/board/route-badge.svelte';
	import StatusPip from '$components/board/status-pip.svelte';
	import OccupancyPip from '$components/board/occupancy-pip.svelte';

	let { arrival, showStopName = false, showCrowding = false, hourCycle } = $props();

	const isCancel = $derived(arrival.status === 'CANCEL');
	const isSched = $derived(arrival.status === 'SCHED');
	const clock = $derived(formatTime(arrival.departureAt, hourCycle));
	// Board grid renders LTR regardless of document direction.
	// Swap TO label and destination text order for Arabic so the
	// Arabic label appears after the destination, not before it.
	const isRTL = $derived(getLocale() === 'ar');
</script>

<div
	class="row status-{arrival.status}"
	style:display="grid"
	style:grid-template-columns="200px 1fr 380px 380px"
	style:align-items="center"
	style:gap="24px"
	style:padding="0 8px"
	style:border-bottom="1px solid var(--rule)"
	style:position="relative"
	style:opacity={isCancel ? 0.78 : 1}
>
	<RouteBadge route={arrival.route} />

	<div style:min-width="0">
		<div
			class="display"
			style:font-size="48px"
			style:font-weight="700"
			style:line-height="1.05"
			style:letter-spacing="-0.01em"
			style:white-space="nowrap"
			style:overflow="hidden"
			style:text-overflow="ellipsis"
		>
			{arrival.name}
		</div>
		<div
			style:font-size="26px"
			style:line-height="1.15"
			style:color="var(--ink-dim)"
			style:margin-top="6px"
			style:display="flex"
			style:align-items="baseline"
			style:gap="10px"
			style:overflow="hidden"
		>
			{#if isRTL}
				<span style:overflow="hidden" style:text-overflow="ellipsis" style:white-space="nowrap"
					>{arrival.dest}</span
				>
				<span
					class="sc"
					style:font-size="18px"
					style:letter-spacing="0.16em"
					style:color="var(--ink-mute)"
					style:flex-shrink="0">{t.board_to()}</span
				>
			{:else}
				<span
					class="sc"
					style:font-size="18px"
					style:letter-spacing="0.16em"
					style:color="var(--ink-mute)"
					style:flex-shrink="0">{t.board_to()}</span
				>
				<span style:overflow="hidden" style:text-overflow="ellipsis" style:white-space="nowrap"
					>{arrival.dest}</span
				>
			{/if}
			{#if showStopName && arrival.stopName}
				<span
					class="sc"
					style:font-size="16px"
					style:letter-spacing="0.16em"
					style:color="var(--ink-mute)"
					style:flex-shrink="0"
					style:margin-inline-start="6px">{t.board_from()} {arrival.stopName}</span
				>
			{/if}
		</div>
	</div>

	<ArrivalHero {arrival} {hourCycle} />

	<div dir="ltr" style:text-align="right">
		<StatusPip status={arrival.status} delta={arrival.delta} large />
		<div
			class="mono"
			style:margin-top="6px"
			style:font-size="22px"
			style:color="var(--ink-mute)"
			style:letter-spacing="0.04em"
		>
			{#if isCancel}
				<span class="canceled-time">{clock}</span>
			{:else if isSched}
				{t.board_timetable()}
			{:else}
				{t.board_sched()} {clock}
			{/if}
		</div>
		{#if showCrowding && arrival.occupancy && !isCancel}
			<div style:margin-top="6px">
				<OccupancyPip level={arrival.occupancy} />
			</div>
		{/if}
	</div>
</div>
