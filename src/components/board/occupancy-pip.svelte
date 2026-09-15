<script>
	import * as t from '$lib/paraglide/messages.js';

	const LEVELS = {
		LIGHT: { filled: 1 },
		MEDIUM: { filled: 2 },
		FULL: { filled: 3 }
	};

	let { level, large = false } = $props();

	const s = $derived(LEVELS[level]);
	const size = $derived(large ? 28 : 22);
	const label = $derived.by(() => {
		if (!s) return '';
		if (level === 'LIGHT') return t.board_occupancy_light();
		if (level === 'MEDIUM') return t.board_occupancy_medium();
		if (level === 'FULL') return t.board_occupancy_full();
		return '';
	});
</script>

{#if s}
	<span
		class="occupancy-{level} sc"
		dir="ltr"
		style:display="inline-flex"
		style:align-items="center"
		style:gap="10px"
		style:font-weight="500"
		style:font-size="{size}px"
		style:color="var(--occupancy-tone)"
		style:letter-spacing="0.1em"
	>
		<span aria-hidden="true" style:font-size="{size * 0.95}px">
			{#each [0, 1, 2] as i (i)}{i < s.filled ? '●' : '○'}{/each}
		</span>
		<span>{label}</span>
	</span>
{/if}
