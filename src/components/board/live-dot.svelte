<script>
	let { hasRealtime = false } = $props();
</script>

<span
	class="sc tnum"
	style:display="inline-flex"
	style:align-items="center"
	style:gap="8px"
	style:font-family="'IBM Plex Sans', sans-serif"
	style:font-weight="600"
	style:font-size="15px"
	style:letter-spacing="0.12em"
	style:color="var(--ink-dim)"
>
	<span
		style:width="10px"
		style:height="10px"
		style:border-radius="50%"
		style:background={hasRealtime ? 'var(--ontime)' : 'transparent'}
		style:outline={hasRealtime ? 'none' : '2px solid currentColor'}
		style:outline-offset="-2px"
		style:animation={hasRealtime ? 'board-live-pulse 2s ease-in-out infinite' : 'none'}
	></span>
	<span>{hasRealtime ? 'LIVE' : 'SCHED'}</span>
</span>
