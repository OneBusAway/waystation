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
		background: #000;
		overflow: hidden;
		width: 100vw;
		height: 100vh;
		font-family: 'IBM Plex Sans', system-ui, sans-serif;
	}
</style>
