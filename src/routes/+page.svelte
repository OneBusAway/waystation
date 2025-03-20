<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';

	import Header from '$components/navigation/header.svelte';
	import Footer from '$components/navigation/footer.svelte';

	let arrivalsAndDepartures = $state([]);
	let loading = $state(true);

	// Calculate arrival time in minutes
	function getArrivalStatus(predictedTime, scheduledTime) {
		const now = new Date();
		const predicted = new Date(predictedTime);
		const scheduled = new Date(scheduledTime);

		const predictedDiff = predicted - now;
		const scheduledDiff = scheduled - now;

		if (predictedTime == 0) {
			return Math.abs(Math.floor(scheduledDiff / 60000));
		} else {
			return Math.abs(Math.floor(predictedDiff / 60000));
		}
	}

	// Check if the departure is coming soon (within minutes) or if it's a scheduled time
	function isComingSoon(predictedTime, scheduledTime) {
		const minutes = getArrivalStatus(predictedTime, scheduledTime);
		return minutes <= 10; // Show minutes if 10 or fewer minutes away
	}

	// Format scheduled time
	function formatScheduledTime(time) {
		const date = new Date(time);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
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
		}
	});
</script>

<div class="flex h-screen flex-col">
	<Header title={PUBLIC_OBA_REGION_NAME} imageUrl={PUBLIC_OBA_LOGO_URL} />

	<!-- Main content -->
	<div class="flex-1 bg-gray-200 text-black">
		{#if loading}
			<div class="flex h-32 items-center justify-center">
				<p class="text-xl text-gray-600">Loading departures...</p>
			</div>
		{:else if arrivalsAndDepartures.length > 0}
			<div class="flex flex-col divide-y divide-gray-300">
				{#each arrivalsAndDepartures as dep (dep.tripId)}
					<div class="flex items-center gap-x-4 p-4">
						<div class="rounded-lg bg-gray-800 p-4 text-2xl font-bold text-white">
							{dep.routeShortName}
						</div>
						<div class="flex-1 text-xl">
							{dep.tripHeadsign}
						</div>
						<div class="text-right">
							{#if isComingSoon(dep.predictedDepartureTime, dep.scheduledDepartureTime)}
								<div class="text-5xl font-bold">
									{getArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime)}
								</div>
								<div class="text-sm">min</div>
							{:else}
								<div class="text-4xl font-bold">
									{formatScheduledTime(dep.scheduledDepartureTime)}
								</div>
							{/if}
						</div>
					</div>
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
