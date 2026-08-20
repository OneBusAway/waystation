<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import { buildThemeCss } from '$lib/config/theme.js';
	import '../app.css';

	let { children, data } = $props();

	const logoUrl = $derived(data?.theme?.logoUrl || PUBLIC_OBA_LOGO_URL);
	const regionName = $derived(data?.theme?.regionName || PUBLIC_OBA_REGION_NAME);
	const themeStyle = $derived(buildThemeCss(data?.theme ?? {}));
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={logoUrl} />
	<title>{regionName}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	{#if themeStyle}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `<style>${themeStyle}</style>`}
	{/if}
</svelte:head>

{@render children()}
