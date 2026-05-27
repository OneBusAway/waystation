<script>
	import { formatDate } from '$lib/formatters.js';

	let { now } = $props();

	const dateText = $derived(formatDate(now));
	const timeText = $derived(
		now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
	);
	const seconds = $derived(now.getSeconds().toString().padStart(2, '0'));
</script>

<div style:text-align="right">
	<div
		class="sc"
		style:font-size="18px"
		style:letter-spacing="0.22em"
		style:color="var(--ink-mute)"
		style:margin-bottom="4px"
	>
		{dateText}
	</div>
	<div
		class="mono display"
		style:font-size="52px"
		style:font-weight="600"
		style:line-height="1"
		style:letter-spacing="-0.02em"
		style:color="var(--accent)"
		style:white-space="nowrap"
	>
		{timeText}<span
			style:color="var(--ink-dim)"
			style:font-weight="400"
			style:font-size="32px"
			style:margin-left="6px">:{seconds}</span
		>
	</div>
</div>
