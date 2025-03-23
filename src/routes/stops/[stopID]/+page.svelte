<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import Header from '$components/navigation/header.svelte';
	import Footer from '$components/navigation/footer.svelte';
	import Countdown from '$components/countdown.svelte';
	import DepartureList from '$components/departures/list.svelte';
	import Alerts from '$components/alerts/alerts.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	const stop = data.stopData.entry;

	let now = $state(new Date());
	let countdown = $state(0);
	let departureList;
	let alerts;

	async function timerElapsed() {
		await departureList.fetchDepartures();
		await alerts.fetchMaintenanceSituations();
	}

	function tick(counter, date) {
		now = date;
		countdown = counter;
	}

	onMount(async () => {
		await departureList.fetchDepartures();
		await alerts.fetchMaintenanceSituations();
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

		<div class="w-[1px] bg-gray-300"></div>

		<div class="w-[600px] flex-shrink-0 overflow-y-auto">
			<Alerts bind:this={alerts} stopID={data.stopID} />
		</div>
	</div>

	<Footer {stop} class="shrink-0" />
</div>
