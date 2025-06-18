<script>
	import { formatArrivalStatus, formatRouteStatus } from '$lib/formatters';
	import { ArrowDownRight, ArrowUpLeft } from '@lucide/svelte';

	const { dep } = $props();

	const status = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
	const routeStatus = formatRouteStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
</script>

<div class="flex items-center p-5">
	<div class="mr-5 rounded-lg bg-gray-800 p-4 text-2xl font-bold text-white">
		{dep.routeShortName}
	</div>

	<div class="flex flex-1 items-center gap-2 text-xl">
		<span>{dep.tripHeadsign}</span>
		<div class="h-5 w-5 text-green-500">•</div>
		<span class="font-semibold">{dep.stopName}</span>
	</div>

	<div class="flex items-center">
		{#if status.status === 'Departing'}
			<div class="mr-3 flex items-center">
				<ArrowUpLeft class={status.color} strokeWidth={2.3} size={28} />
				<span class="text-xl font-bold {status.color}">{status.text}</span>
			</div>
			<div class="mx-3 h-9 border-l-3 border-gray-400"></div>
		{:else if status.minutes !== null}
			<div class="rounded-sm {routeStatus.color} px-2 py-2 text-center text-white">
				{routeStatus.status}
			</div>
			<div class="mx-3 h-9 border-l-3 border-gray-400"></div>

			<div class="mr-3 flex items-center">
				<ArrowDownRight class="mr-2 {status.color}" strokeWidth={2.3} size={28} />
				<span class="text-lg {status.color}">{status.text}</span>
				<span class="mx-2 text-4xl font-bold {status.color}">{status.minutes}</span>
				<span class="text-lg {status.color}">min</span>
			</div>
			<div class="mx-3 h-9 border-l-3 border-gray-400"></div>
		{/if}
		<div>
			<span class="text-4xl font-bold text-black">{status.displayTime}</span>
		</div>
	</div>
</div>
