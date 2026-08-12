<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import { SITE_TOKENS, BOARD_TOKENS } from '$lib/config/theme.js';
	import '../app.css';

	let { children, data } = $props();

	const logoUrl = $derived(data?.theme?.logoUrl || PUBLIC_OBA_LOGO_URL);
	const regionName = $derived(data?.theme?.regionName || PUBLIC_OBA_REGION_NAME);

	const themeStyle = $derived.by(() => {
		const theme = data?.theme ?? {};

		const siteOverrides = Object.entries(SITE_TOKENS)
			.filter(([key]) => theme[key])
			.map(([key, { cssVar }]) => `${cssVar}:${theme[key]}`)
			.join(';');

		const boardOverrides = Object.entries(BOARD_TOKENS)
			.filter(([key]) => theme[key])
			.map(([key, { cssVar }]) => {
				const base = `${cssVar}:${theme[key]}`;
				if (key === 'boardLate') return `${base};--cancel:${theme[key]}`;
				if (key === 'boardBadgeBg') return `${base};--badge-bg-2:${theme[key]}`;
				return base;
			})
			.join(';');

		const parts = [];
		if (siteOverrides) parts.push(`:root{${siteOverrides}}`);
		if (boardOverrides) parts.push(`:root .theme-departure.theme-dark{${boardOverrides}}`);
		return parts.join('');
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={logoUrl} />
	<title>{regionName}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	{#if themeStyle}
		{@html `<style>${themeStyle}</style>`}
	{/if}
</svelte:head>

{@render children()}
