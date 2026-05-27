<script>
	import { formatTime } from '$lib/formatters.js';
	import ArrivalHero from './arrival-hero.svelte';
	import RouteBadge from './route-badge.svelte';
	import StatusPip from './status-pip.svelte';

	let { arrival, showStopName = false } = $props();

	const isCancel = $derived(arrival.status === 'CANCEL');
	const isSched = $derived(arrival.status === 'SCHED');
	const clock = $derived(formatTime(arrival.departureAt));
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
			style:white-space="nowrap"
			style:overflow="hidden"
			style:text-overflow="ellipsis"
		>
			<span
				class="sc"
				style:font-size="18px"
				style:letter-spacing="0.16em"
				style:color="var(--ink-mute)"
				style:margin-right="10px">TO</span
			>
			{arrival.dest}{#if showStopName && arrival.stopName}<span
					class="sc"
					style:font-size="16px"
					style:letter-spacing="0.16em"
					style:color="var(--ink-mute)"
					style:margin-left="16px">FROM {arrival.stopName}</span
				>{/if}
		</div>
	</div>

	<ArrivalHero {arrival} />

	<div style:text-align="right">
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
				TIMETABLE
			{:else}
				SCHED {clock}
			{/if}
		</div>
	</div>
</div>
