<script>
	import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    let arrivalsAndDepartures = $state([]);
    let stopName = $state("Loading stop information...");
    let stopCode = $state("");

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

    async function fetchStopInfo(id) {
        try {
            const response = await fetch(`api/oba/stops`);
            if (!response.ok) throw new Error('Failed to fetch stop information');
            const data = await response.json();
            if (data ) {
                stopName = data.name;
                stopCode = data.code;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error fetching stop information:', error);
            stopName = "Unknown Stop";
            return false;
        }
    }

    onMount(async () => {
        if (browser) {
            const response = await fetch('/api/oba/departures');
            arrivalsAndDepartures = await response.json();

            await fetchStopInfo(stopCode);
        }
    });
</script>

<div class='bg-red-100 h-screen flex flex-col'>
    <div class='flex gap-x-4 mb-4 bg-slate-50 p-2'>
        <h1 class='text-4xl'>Waystation</h1>
        <h2 class='text-2xl flex-1 self-center'>Departures</h2>
        <div class='self-center'>
            current time here
        </div>
    </div>


    {#if arrivalsAndDepartures.length > 0}
        <div class='flex flex-col gap-y-2'>
            {#each arrivalsAndDepartures as dep}
                <div class='flex bg-red-100 gap-x-4 px-2'>
                    <div>
                        <h2 class='text-5xl'>{dep.routeShortName}</h2>
                    </div>
                    <div class='flex-1 text-xl self-center'>
                        {dep.tripHeadsign}
                    </div>
                    <div class='text-2xl self-center'>
                        {getArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime)}min
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p>Loading...</p>
    {/if}

    <div class="bg-gray-300 p-3 text-black">
        <div class="flex justify-between items-center">
            <div class="flex items-center">
                <span class="text-sm ml-2">[Code:{stopCode}]</span>
            </div>
            <div class="text-sm">
                Stop No. {stopCode} - {stopName}
            </div>
        </div>
    </div>
</div>
