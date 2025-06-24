<script>
	import { formatArrivalStatus, formatRouteStatus } from '$lib/formatters';
	import { ArrowDownRight, ArrowUpLeft, ChevronRight } from '@lucide/svelte';

	const { dep } = $props();

	const status = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
	const routeStatus = formatRouteStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);

	const colorClass = {
		green: 'text-green-500',
		red: 'text-red-500',
		blue: 'text-blue-500'
	}[routeStatus.color] ?? 'text-gray-500';

	let borderClass = $state({});

	borderClass = {
		green: 'border-[#00BD2F]',
	}[routeStatus.color] ?? 'border-[#00273B66]';

	if (status.status === 'Departing') borderClass = 'border-[#EB3223]';

	const shadowColor = {
		green: 'rgba(0,189,47,0.1);',
	}[routeStatus.color] ?? 'rgba(0,0,0,0.08)';
</script>

<div
	class={`m-4 flex items-center rounded-[16px] border-r-5 border-l-5 ${borderClass} bg-[rgba(255,255,255,0.85)] p-5`}
	style={`box-shadow: 0 0 10px 10px ${shadowColor}`}
>
	<div
		class="mr-5 flex min-w-28 items-center justify-center rounded-lg bg-[#00273B] px-4 py-3 text-2xl font-bold whitespace-nowrap text-white"
	>
		{dep.routeShortName}
	</div>

	<div class="flex flex-1 flex-wrap items-center gap-x-2 text-xl leading-tight min-w-0 overflow-hidden">
		<span class="font-semibold whitespace-nowrap truncate">{dep.tripHeadsign}</span>
		<span class="flex items-center gap-x-2 whitespace-nowrap min-w-0 overflow-hidden">
			<ChevronRight class={colorClass} />
			<span class="truncate">{dep.stopName}</span>
		</span>
	</div>

	<div class="flex items-center gap-1 ml-3">
		{#if status.status === 'Departing'}
			<div class="flex items-center">
				<ArrowUpLeft class={status.color} strokeWidth={2.3} size={28} />
				<span class="{status.color} text-xl font-bold whitespace-nowrap">{status.text}</span>
			</div>
		{:else if status.minutes !== null}
			{#if window.innerWidth >= 1152}
				<div class="text-{routeStatus.color}-500 bg-[#00000009] rounded-[10px] px-3 py-2 text-center font-bold mr-2">
					{routeStatus.status}
				</div>
			{/if}

			<div class="flex items-center gap-1.5 whitepsace-nowrap">
				<ArrowDownRight class={colorClass} strokeWidth={2.3} size={28} />
				<span class="text-lg whitespace-nowrap">{status.text}</span>
				<span class={`text-${routeStatus.color}-500 text-3xl font-bold`}>{status.minutes}</span>
				<span class="text-lg">min</span>
			</div>
		{/if}

		{#if status.status === 'Departing' || status.minutes !== null}
			<ChevronRight class="text-gray-400" />
		{/if}

		<span class="text-4xl font-bold whitespace-nowrap">{status.displayTime}</span>
	</div>
</div>
