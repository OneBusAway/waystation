<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';

	import Header from '$components/navigation/header.svelte';
	import Controller from '$components/controller/controller.svelte';
	import Footer from '$components/navigation/footer.svelte';

	let { data } = $props();

	const stops = data.dataBlocks.map((eachBlock) => eachBlock.entry);
</script>

<div class="flex h-screen flex-col">
	<Header title={PUBLIC_OBA_REGION_NAME} imageUrl={PUBLIC_OBA_LOGO_URL} />
	<div class="flex flex-1 gap-4 overflow-hidden">
		<div class="flex-1 overflow-y-auto">
			<Controller stopIDs={data.stopIDs} />
		</div>
	</div>

	<div id="footer">
		<Footer {stops} class="shrink-0" />
	</div>
</div>
