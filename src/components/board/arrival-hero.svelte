<script>
	import { formatTime } from '$lib/formatters.js';

	let { arrival } = $props();

	const isCancel = $derived(arrival.status === 'CANCEL');
	const isSched = $derived(arrival.status === 'SCHED');
	const showAsClock = $derived(isSched || arrival.min > 30);
	const showNow = $derived(!isSched && arrival.min <= 0);
	const clock = $derived(formatTime(arrival.departureAt));
	const clockParts = $derived.by(() => {
		const m = /(\d+:\d+)\s*(AM|PM)/i.exec(clock);
		return m ? { hm: m[1], ap: m[2] } : { hm: clock, ap: '' };
	});
</script>

{#if isCancel}
	<div style:text-align="right">
		<div
			class="display sc"
			style:font-size="80px"
			style:font-weight="800"
			style:line-height="0.9"
			style:letter-spacing="0.04em"
			style:color="var(--status-tone)"
		>
			—— ——
		</div>
		<div
			class="sc"
			style:font-size="18px"
			style:letter-spacing="0.22em"
			style:color="var(--ink-mute)"
			style:margin-top="6px"
		>
			DO NOT BOARD
		</div>
	</div>
{:else if showNow}
	<div style:text-align="right">
		<div
			class="display sc"
			style:font-size="130px"
			style:font-weight="800"
			style:line-height="0.9"
			style:letter-spacing="0.04em"
			style:color="var(--accent)"
		>
			NOW
		</div>
	</div>
{:else if showAsClock}
	<div style:text-align="right">
		<div
			class="display mono"
			style:font-size="110px"
			style:font-weight="600"
			style:line-height="0.9"
			style:letter-spacing="-0.02em"
			style:color="var(--accent)"
		>
			{clockParts.hm}<span
				style:font-size="56px"
				style:margin-left="8px"
				style:color="var(--ink-dim)">{clockParts.ap}</span
			>
		</div>
	</div>
{:else}
	<div
		style:text-align="right"
		style:display="flex"
		style:align-items="baseline"
		style:justify-content="flex-end"
		style:gap="14px"
	>
		<div
			class="display mono"
			style:font-size="156px"
			style:font-weight="700"
			style:line-height="0.9"
			style:letter-spacing="-0.04em"
			style:color="var(--accent)"
			style:font-variant-numeric="tabular-nums"
		>
			{arrival.min}
		</div>
		<div
			class="sc display"
			style:font-size="36px"
			style:font-weight="700"
			style:letter-spacing="0.06em"
			style:color="var(--ink-dim)"
		>
			MIN
		</div>
	</div>
{/if}
