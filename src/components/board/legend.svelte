<script>
	const items = [
		{ glyph: '●', label: 'ON TIME' },
		{ glyph: '▲', label: 'EARLY' },
		{ glyph: '▼', label: 'DELAYED' },
		{ glyph: '○', label: 'SCHEDULED' },
		{ glyph: '✕', label: 'CANCELED' }
	];
</script>

<div style:display="flex" style:justify-content="center" style:gap="36px">
	{#each items as item (item.label)}
		<span
			class="sc tnum"
			style:display="inline-flex"
			style:gap="8px"
			style:align-items="center"
			style:font-size="14px"
			style:letter-spacing="0.18em"
			style:color="var(--ink-mute)"
		>
			<span style:font-size="16px" style:color="var(--ink-dim)">{item.glyph}</span>
			<span>{item.label}</span>
		</span>
	{/each}
</div>
