<script>
	let { route } = $props();
	const len = $derived(route?.length ?? 0);
	const size = $derived(len <= 1 ? 96 : len === 2 ? 80 : 60);
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
	>
		{route}
	</div>
</div>
