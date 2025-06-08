<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';

	import Header from '$components/navigation/header.svelte';
	import Footer from '$components/navigation/footer.svelte';
	import DepartureList from '$components/departures/list.svelte';

	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { data } = $props();

	const stop = data.stopData.entry;
	const REFRESH_INTERVAL = 30000; // todo: make it  a configurable option

	let interval;
	let departureList;

	async function autoRefresh() {
		await departureList.fetchDeparturesAndAlerts();
	}

	onMount(async () => {
		await autoRefresh();

		if (browser) {
			interval = setInterval(autoRefresh, REFRESH_INTERVAL);
		}
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="flex h-screen flex-col">
	<div class="flex flex-1 gap-4 overflow-hidden">
		<div class="flex-1 overflow-y-auto">
			<Header title={PUBLIC_OBA_REGION_NAME} imageUrl={PUBLIC_OBA_LOGO_URL} />
			<DepartureList bind:this={departureList} stopID={data.stopID} />
		</div>
	</div>

	<Footer {stop} class="shrink-0" />
</div>
