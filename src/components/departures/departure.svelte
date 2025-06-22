<script>
	import { formatArrivalStatus, formatRouteStatus } from '$lib/formatters';
	import { ArrowDownRight, ArrowUpLeft, ChevronRight } from '@lucide/svelte';

	const { dep } = $props();

	const status = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
	const routeStatus = formatRouteStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
</script>

<div
	class="m-4 flex items-center rounded-[16px] border-r-5 border-l-5 border-[#8D8D8D] bg-[rgba(255,255,255,0.85)] p-5"
	style="box-shadow: 0 0 10px 10px rgba(0,0,0,0.08);"
>
	<div
		class="mr-5 flex min-w-28 items-center justify-center rounded-lg bg-[#00273B] px-4 py-3 text-2xl font-bold whitespace-nowrap text-white"
	>
		{dep.routeShortName}
	</div>

	<div class="flex flex-1 flex-wrap items-center gap-x-2 text-xl leading-tight">
		<span class="font-semibold whitespace-nowrap">{dep.tripHeadsign}</span>
		<span class="flex items-center gap-x-2 whitespace-nowrap">
			<ChevronRight class="text-green-500" />
			<span>{dep.stopName}</span>
		</span>
	</div>

	<div class="flex items-center gap-1">
		{#if status.status === 'Departing'}
			<div class="flex items-center">
				<ArrowUpLeft class={status.color} strokeWidth={2.3} size={28} />
				<span class="{status.color} text-xl font-bold whitespace-nowrap">{status.text}</span>
			</div>
		{:else if status.minutes !== null}
			<div class="{routeStatus.color} rounded-sm px-2 py-2 text-center text-white">
				{routeStatus.status}
			</div>

			<div class="flex items-center gap-1.5 whitepsace-nowrap">
				<ArrowDownRight class={status.color} strokeWidth={2.3} size={28} />
				<span class="{status.color} text-lg">{status.text}</span>
				<span class="{status.color} text-4xl font-bold">{status.minutes}</span>
				<span class="{status.color} text-lg">min</span>
			</div>
		{/if}

		{#if status.status === 'Departing' || status.minutes !== null}
			<ChevronRight class="text-gray-400" />
		{/if}

		<span class="text-4xl font-bold whitespace-nowrap">{status.displayTime}</span>
	</div>
</div>
