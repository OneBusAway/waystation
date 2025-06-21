<script>
	import { formatArrivalStatus, generateRandomID, sortEarliestDepartures } from '$lib/formatters';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	import Alerts from '$components/alerts/alerts.svelte';
	import Departure from '$components/departures/departure.svelte';

	let { stopIDs = [] } = $props();

	let allDepartures = $state([]);
	let situations = $state([]);
	let loading = $state(true);

	let interval;

	const REFRESH_INTERVAL = 30000; // todo: make it a configurable option
	const MAX_DEPARTURES = 99;

	function stopRequestDataModel(dep, stopID, stopName) {
		const status = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
		const id = generateRandomID(dep.tripId, dep.stopId);

		return {
			...dep,
			stopID,
			status,
			stopName,
			uniqueId: id
		};
	}

	async function obaAPI(stopID) {
		const response = await fetch(`/api/oba/arrivals-and-departures-for-stop/${stopID}`);
		if (!response) throw new Error(`Fetch Error: Failed to fetch stop ${stopID}`);
		const json = await response.json();

		return {
			stopID,
			stopName:
				Object.values(json.data.references.stops).find((targetStop) => targetStop.id === stopID)
					?.name ?? `Stop #` + stopID.split('_')[1],
			departures: json.data.entry.arrivalsAndDepartures,
			situations: json.data.references?.situations || []
		};
	}

	export async function fetchStops() {
		loading = true;
		try {
			const response = await Promise.all(stopIDs.map(async (id) => obaAPI(id)));

			allDepartures = response.flatMap((eachResponse) => {
				const stopID = eachResponse.stopID;
				const stopName = eachResponse.stopName;
				const departures = eachResponse.departures;

				return departures.map((dep) => {
					return stopRequestDataModel(dep, stopID, stopName);
				});
			});

			situations = response.flatMap((eachSituation) => eachSituation.situations);

			allDepartures = allDepartures.filter((dep) => dep.status !== null);
			allDepartures = sortEarliestDepartures(allDepartures);
			allDepartures = allDepartures.slice(0, MAX_DEPARTURES);
		} catch (error) {
			console.error('Error fetching stops:', error);
			allDepartures = [];
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		await fetchStops();

		if (browser) {
			clearInterval(interval);
			interval = setInterval(fetchStops, REFRESH_INTERVAL);
		}
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="flex flex-1 overflow-hidden">
	<div class="flex flex-1 flex-col overflow-y-auto bg-gray-200 text-black">
		{#if loading}
			<div class="flex h-32 items-center justify-center">
				<p class="text-xl text-gray-600">Loading departures...</p>
			</div>
		{:else if allDepartures.length > 0}
			<div class="flex flex-col divide-y divide-gray-300">
				{#each allDepartures as dep (dep.uniqueId)}
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

	{#if situations.length > 0 && situations[0].summary?.value}
		<div class="flex-shrink-0 basis-[35%] overflow-y-auto">
			<Alerts {situations} />
		</div>
	{/if}
</div>
