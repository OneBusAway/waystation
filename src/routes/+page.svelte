<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';

	let arrivalsAndDepartures = $state([]);

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
		}
	});
</script>

<div class="flex h-screen flex-col bg-red-100">
	<div class="mb-4 flex gap-x-4 bg-slate-50 p-2">
		<div class="flex w-full justify-between gap-4 px-2 py-2 md:w-auto">
			<div class="flex items-center justify-center gap-x-2">
				<a href="/" class="block">
					<img src={PUBLIC_OBA_LOGO_URL} alt="OneBusAway" class="h-10 rounded-sm" />
				</a>
				<a href="/" class="block text-xl font-extrabold">
					{PUBLIC_OBA_REGION_NAME}
				</a>
			</div>
		</div>
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
