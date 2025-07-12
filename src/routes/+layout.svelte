<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={PUBLIC_OBA_LOGO_URL} />
	<title>{PUBLIC_OBA_REGION_NAME}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{@render children()}
