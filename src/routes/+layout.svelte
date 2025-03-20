<script>
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import '../app.css';
	let { children } = $props();
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
</script>

<!-- Dynamically add custom favicon -->
<svelte:head>
	<link rel="icon" type="image/png" href={PUBLIC_OBA_LOGO_URL} />
	<title>{PUBLIC_OBA_REGION_NAME}</title>
</svelte:head>

<ParaglideJS {i18n}>
	{@render children()}
</ParaglideJS>
