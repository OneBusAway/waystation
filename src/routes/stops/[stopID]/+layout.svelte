<script>
	let { children } = $props();
</script>

<div class="board-body">
	{@render children()}
</div>

<style>
	.board-body {
		margin: 0;
		padding: 0;
		overflow: hidden;
		font-family: 'IBM Plex Sans', system-ui, sans-serif;
	}

	:global(body)::before {
		display: none;
	}
</style>
