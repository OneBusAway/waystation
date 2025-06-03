<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import Header from '$components/navigation/header.svelte';
	import Footer from '$components/navigation/footer.svelte';
	import Countdown from '$components/countdown.svelte';
	import DepartureList from '$components/departures/list.svelte';
	import Alerts from '$components/alerts/alerts.svelte';
	import { situationsStore, fetchSituations } from '$lib/situations';
	import { onMount } from 'svelte';

	let { data } = $props();
	const stop = data.stopData.entry;

	let now = $state(new Date());
	let countdown = $state(0);
	let departureList;
	let hasAlerts = $derived($situationsStore.length > 0);

	async function timerElapsed() {
		await departureList.fetchDepartures();
		await fetchSituations(data.stopID);
	}

	function tick(counter, date) {
		now = date;
		countdown = counter;
	}

	onMount(async () => {
		await departureList.fetchDepartures();
		await fetchSituations(data.stopID);
	});
</script>

<Countdown refreshInterval={30} {tick} {timerElapsed} />

<div class="flex h-screen flex-col">
	<div class="flex flex-1 gap-4 overflow-hidden">
		<div class="flex-1 overflow-y-auto">
			<Header
				title={PUBLIC_OBA_REGION_NAME}
				imageUrl={PUBLIC_OBA_LOGO_URL}
				currentDate={now}
				{countdown}
			/>
			<DepartureList bind:this={departureList} stopID={data.stopID} />
		</div>

		{#if hasAlerts}
			<div class="w-[1px] bg-gray-300"></div>

			<div class="w-[600px] flex-shrink-0 overflow-y-auto">
				<Alerts stopID={data.stopID} />
			</div>
		{/if}
	</div>

	<Footer {stop} class="shrink-0" />
</div>
