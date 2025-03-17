<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let arrivalsAndDepartures = $state([]);
	let StopCode = $state('Loading...');
	let StopName = $state('Loading...');

	// TODO: this was copied and pasted from Wayfinder. Unify them.
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

	onMount(async () => {
		if (browser) {
			const response = await fetch('/api/oba/departures');
			arrivalsAndDepartures = await response.json();

			const stopResponse = await fetch('/api/oba/stop');
			const stopInfo = await stopResponse.json();

			StopName = stopInfo[0].name;
			StopCode = stopInfo[0].code;
		}
	});
</script>

<div class="flex max-h-[100vh] min-h-[90vh] flex-col bg-red-100">
	<div class="mb-4 flex gap-x-4 bg-slate-50 p-2">
		<h1 class="text-4xl">Waystation</h1>
		<h2 class="flex-1 self-center text-2xl">Departures</h2>
		<div class="self-center">current time here</div>
	</div>

	{#if arrivalsAndDepartures.length > 0}
		<div class="flex flex-col gap-y-2">
			{#each arrivalsAndDepartures as dep}
				<div class="flex gap-x-4 bg-red-100 px-2">
					<div>
						<h2 class="text-5xl">{dep.routeShortName}</h2>
					</div>
					<div class="flex-1 self-center text-xl">
						{dep.tripHeadsign}
					</div>
					<div class="self-center text-2xl">
						{getArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime)}min
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>Loading...</p>
	{/if}
</div>
<div class="py-4">
	<footer class="flex items-center justify-center">
		<h3 class="text-2xl">Stop No. {StopCode} - {StopName}</h3>
	</footer>
</div>
