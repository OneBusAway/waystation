<script>
	import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    let arrivalsAndDepartures = $state([]);
    let currentTime = $state(new Date());
    let currentDate = $state(new Date());
    let stopName = $state("Loading stop information...");
    let stopCode = $state("");
    let loading = $state(true);

    // TODO: this was copied and pasted from Wayfinder. Unify them.

    // Update current time every second
    function startClock() {
        const timer = setInterval(() => {
            currentTime = new Date();
            currentDate = new Date();
        }, 1000);
        
        return () => clearInterval(timer);
    }

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

    // Format time for display
    function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        second: '2-digit',  // Add this line to show seconds
        hour12: true 
    });
}

    // Format date for display
    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
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

    // Fetch stop information using the OneBusAway API
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

    // Fetch departures for the stop
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
            startClock();
            // Fetch stop information and then departures
            await fetchStopInfo(stopCode);
            await fetchDepartures();
        }
    });
</script>

<div class="flex flex-col min-h-screen bg-black text-white">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-black">
        <div class="flex items-center">
            <div class="mr-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                    <path d="M3 9v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"></path>
                    <path d="M7 9v7"></path>
                    <path d="M17 9v7"></path>
                    <path d="M15 2v7"></path>
                    <path d="M9 2v7"></path>
                </svg>
            </div>
            <h1 class="text-xl font-bold">METRO</h1>
            <div class="mx-4 text-3xl font-light">Departures</div>
        </div>
        <div class="text-right">
            <div class="text-sm">{formatDate(currentDate)}</div>
            <div class="text-3xl font-bold">{formatTime(currentTime)}</div>
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

    <!-- Footer -->
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