<script>
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import { formatTime2 } from '$lib/formatters';
	import {stopInfo} from "$lib/store";

	import Header from '$components/navigation/header.svelte';
	import Footer from '$components/navigation/footer.svelte';
	import Departure from '$components/navigation/departure.svelte';

	let arrivalsAndDepartures = $state([]);
	let loading = $state(true);
	let now = $state(new Date());
	const refreshInterval = 30; // Refresh every 30 seconds
	let countdown = $state(refreshInterval);
	let intervalTimer;

	// Get status for arrival or departure
	function getArrivalStatus(predictedTime, scheduledTime) {
		const now = new Date();
		const predicted = new Date(predictedTime);

		const predictedDiff = Math.floor((predicted - now) / 60000);

		if (predictedTime === 0) {
			return {
				status: 'Scheduled',
				text: '',
				color: 'text-gray-500',
				minutes: null,
				displayTime: formatTime2(scheduledTime)
			};
		} else if (predictedDiff < -2) {
			// If the bus left more than 2 minutes ago, it's already gone
			return null;
		} else if (predictedDiff <= 0) {
			// If it's within 2 minutes of departure, show "Departing now" with time
			return {
				status: 'Departing',
				text: 'Departing now',
				color: 'text-red-500',
				minutes: null,
				displayTime: formatTime2(predictedTime)
			};
		} else if (predictedDiff <= 10) {
			return {
				status: 'Arriving',
				text: 'Arriving in',
				color: 'text-blue-500',
				minutes: predictedDiff,
				displayTime: formatTime2(predictedTime)
			};
		} else {
			return {
				status: 'Scheduled',
				text: '',
				color: 'text-gray-500',
				minutes: null,
				displayTime: formatTime2(scheduledTime)
			};
		}
	}

	// Fetch departures for the stop
	async function fetchDepartures() {
		loading = true;
		try {
			const response = await fetch(`/api/oba/departures`);
			if (!response.ok) throw new Error('Failed to fetch departures');
			arrivalsAndDepartures = await response.json();
		} catch (error) {
			console.error('Error fetching departures:', error);
			arrivalsAndDepartures = [];
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		if (browser) {
			await fetchDepartures();

			intervalTimer = setInterval(async () => {
				now = new Date();
				countdown -= 1;

				// When the counter reaches zero, fetch new departures and reset the counter
				if (countdown <= 0) {
					countdown = refreshInterval;
					await fetchDepartures();
				}
			}, 1000);
		}
	});

	onDestroy(() => {
		clearInterval(intervalTimer);
	});
</script>

<div class="flex h-screen flex-col">
	<Header
		title={PUBLIC_OBA_REGION_NAME}
		imageUrl={PUBLIC_OBA_LOGO_URL}
		currentDate={now}
		{countdown}
	/>

	<div class="flex justify-center bg-blue-400 font-bold text-xl py-2 px-2">
		Stop No. {$stopInfo.code} - {$stopInfo.name}
	</div>

	<div class="flex-1 bg-gray-200 text-black">
		{#if loading}
			<div class="flex h-32 items-center justify-center">
				<p class="text-xl text-gray-600">Loading departures...</p>
			</div>
		{:else if arrivalsAndDepartures.length > 0}
			<div class="flex flex-col divide-y divide-gray-300">
				{#each arrivalsAndDepartures as dep (dep.tripId)}
					{#if getArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime)}
						<Departure
							{dep}
							status={getArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime)}
						/>
					{/if}
				{/each}
			</div>
		{:else}
			<div class="flex h-32 items-center justify-center">
				<p class="text-xl text-gray-600">No departures available</p>
			</div>
		{/if}
	</div>

	<Footer />
</div>
