<script>
	import { formatArrivalStatus } from '$lib/formatters';
	import Departure from '$components/departures/departure.svelte';

	let { stopID } = $props();

	let arrivalsAndDepartures = $state([]);
	let loading = $state(true);

	export async function fetchDepartures() {
		loading = true;
		try {
			const response = await fetch(`/api/oba/arrivals-and-departures-for-stop/${stopID}`);
			if (!response.ok) throw new Error('Failed to fetch departures');
			const responseBody = await response.json();
			arrivalsAndDepartures = responseBody.data.entry.arrivalsAndDepartures.map((dep) => {
				const status = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
				return { ...dep, status };
			});
		} catch (error) {
			console.error('Error fetching departures:', error);
			arrivalsAndDepartures = [];
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex-1 bg-gray-200 text-black">
	{#if loading}
		<div class="flex h-32 items-center justify-center">
			<p class="text-xl text-gray-600">Loading departures...</p>
		</div>
	{:else if arrivalsAndDepartures.length > 0}
		<div class="flex flex-col divide-y divide-gray-300">
			{#each arrivalsAndDepartures as dep ((dep.predictedDepartureTime, dep.scheduledDepartureTime, dep.vehicleId))}
				{#if formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime)}
					<Departure {dep} />
				{/if}
			{/each}
		</div>
	{:else}
		<div class="flex h-32 items-center justify-center">
			<p class="text-xl text-gray-600">No departures available</p>
		</div>
	{/if}
</div>
