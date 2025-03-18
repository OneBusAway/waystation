<script>
	import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    let arrivalsAndDepartures = $state([]);
    let stopName = $state("Loading stop information...");
    let stopCode = $state("");
    let loading = $state(true);
    
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

    async function fetchDepartures(id = stopCode) {
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
            await fetchStopInfo(stopCode);
            await fetchDepartures();
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


    <!-- Main content -->
    <div class="flex-1 bg-gray-200 text-black">
        {#if loading}
            <div class="flex justify-center items-center h-32">
                <p class="text-xl text-gray-600">Loading departures...</p>
            </div>
        {:else if arrivalsAndDepartures.length > 0}
            <div class="flex flex-col divide-y divide-gray-300">
                {#each arrivalsAndDepartures as dep}
                    <div class="flex items-center p-4">
                        <div class="flex items-center justify-center bg-gray-800 text-white rounded w-12 h-12 mr-4">
                            <span class="text-2xl font-bold">{dep.routeShortName}</span>
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
            <div class="flex justify-center items-center h-32">
                <p class="text-xl text-gray-600">No departures available</p>
            </div>
        {/if}
    </div>

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
