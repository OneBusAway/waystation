<script>
	import { formatArrivalStatus } from '$lib/formatters';

	import Alerts from '$components/alerts/alerts.svelte';
	import Departure from '$components/departures/departure.svelte';

	let { stopID } = $props();

	let arrivalsAndDepartures = $state([]);
	let situations = $state([]);
	let loading = $state(true);

	export async function fetchDeparturesAndAlerts() {
		loading = true;
		try {
			const response = await fetch(`/api/oba/arrivals-and-departures-for-stop/${stopID}`);
			if (!response.ok) throw new Error('Failed to fetch departures');
			const responseBody = await response.json();
			arrivalsAndDepartures = responseBody.data.entry.arrivalsAndDepartures.map((dep) => {
				const status = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
				const uniqueId = `${dep.tripId ?? '0'}-${dep.stopId ?? '0'}-${Math.floor(Math.random() * 10000)}`;
				return { ...dep, status, uniqueId };
			});
			situations = responseBody.data.references?.situations || [];
		} catch (error) {
			console.error('Error fetching departures:', error);
			arrivalsAndDepartures = [];
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-1 gap-4 overflow-hidden">
	<div class="flex flex-1 flex-col overflow-y-auto bg-gray-200 text-black">
		{#if loading}
			<div class="flex h-32 items-center justify-center">
				<p class="text-xl text-gray-600">Loading departures...</p>
			</div>
		{:else if arrivalsAndDepartures.length > 0}
			<div class="flex flex-col divide-y divide-gray-300">
				{#each arrivalsAndDepartures as dep (dep.uniqueId)}
					{#if dep.status}
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
	{#if situations.length > 0}
		<div class="w-[1px] bg-gray-300"></div>

		<div class="w-[600px] flex-shrink-0 overflow-y-auto">
			<Alerts {situations} />
		</div>
	{/if}
</div>
