<script>
	const STATUS = {
		ONTIME: { glyph: '●', label: 'ON TIME', weight: 500 },
		EARLY: { glyph: '▲', label: 'EARLY', weight: 700 },
		LATE: { glyph: '▼', label: 'DELAYED', weight: 700 },
		CANCEL: { glyph: '✕', label: 'CANCELED', weight: 700 },
		SCHED: { glyph: '○', label: 'SCHEDULED', weight: 500 }
	};

	let { status, delta = null, large = false } = $props();

	const s = $derived(STATUS[status]);
	const size = $derived(large ? 28 : 22);
	const label = $derived.by(() => {
		if (!s) return '';
		if (status === 'EARLY' && delta != null) return `${Math.abs(delta)} MIN EARLY`;
		if (status === 'LATE' && delta != null) return `${delta} MIN LATE`;
		return s.label;
	});
</script>

{#if s}
	<span
		class="status-{status} sc tnum"
		style:display="inline-flex"
		style:align-items="center"
		style:gap="10px"
		style:font-weight={s.weight}
		style:font-size="{size}px"
		style:color="var(--status-tone)"
		style:letter-spacing="0.1em"
	>
		<span aria-hidden="true" style:font-size="{size * 0.95}px">{s.glyph}</span>
		<span>{label}</span>
	</span>
{/if}
