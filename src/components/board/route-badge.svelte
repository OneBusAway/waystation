<script>
	let { route } = $props();
	const len = $derived(route?.length ?? 0);
	// Some agencies publish words as the short name ("Monorail", "Edmonds - Kingston"), so long
	// routes step down and anything still too wide truncates rather than spilling out of the tile.
	const size = $derived(len <= 1 ? 96 : len === 2 ? 80 : len <= 4 ? 60 : 32);
</script>

<div
	class="route-badge"
	style:width="156px"
	style:height="110px"
	style:border-radius="14px"
	style:display="grid"
	style:place-items="center"
	style:position="relative"
>
	<div
		class="display tnum"
		style:font-size="{size}px"
		style:font-weight="800"
		style:line-height="1"
		style:color="var(--badge-ink)"
		style:letter-spacing="-0.02em"
		style:max-width="132px"
		style:white-space="nowrap"
		style:overflow="hidden"
		style:text-overflow="ellipsis"
	>
		{route}
	</div>
</div>
