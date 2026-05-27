<script>
	import { formatTimestamp } from '$lib/formatters.js';

	let { situation } = $props();

	const headline = $derived(situation?.summary?.value?.trim?.() ?? '');
	const activeWindow = $derived(situation?.activeWindows?.[0]);
	const windowStart = $derived(activeWindow?.from ? formatTimestamp(activeWindow.from) : '');
	const windowEnd = $derived(activeWindow?.to ? formatTimestamp(activeWindow.to) : '');
	const severity = $derived(situation?.severity?.toLowerCase?.() ?? 'alert');
</script>

<div
	class="alert-badge alert-{severity}"
	style:width="760px"
	style:padding="16px 24px"
	style:border-radius="4px"
	style:display="grid"
	style:grid-template-columns="auto 1fr"
	style:gap="20px"
	style:align-items="center"
>
	<div
		class="alert-glyph"
		style:width="64px"
		style:height="64px"
		style:display="grid"
		style:place-items="center"
		style:border="2px solid currentColor"
	>
		<span style:font-size="36px" style:font-weight="800" style:line-height="1">!</span>
	</div>
	<div>
		<div
			class="sc"
			style:font-size="14px"
			style:letter-spacing="0.22em"
			style:color="var(--ink-mute)"
		>
			SERVICE ADVISORY{#if windowStart}
				· {windowStart}{#if windowEnd}
					→ {windowEnd}{/if}{/if}
		</div>
		<div
			style:font-size="22px"
			style:font-weight="600"
			style:line-height="1.25"
			style:margin-top="4px"
			style:color="var(--ink)"
		>
			{headline}
		</div>
	</div>
</div>
