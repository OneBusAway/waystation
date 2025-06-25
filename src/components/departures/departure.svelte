<script>
	import { formatArrivalStatus, formatRouteStatus } from '$lib/formatters';
	import { ArrowDownRight, ArrowUpLeft, ChevronRight } from '@lucide/svelte';

	const { dep } = $props();

	const status = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
	const routeStatus = formatRouteStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);

	const COLOR_CLASSES = {
		green: 'text-green-500',
		red: 'text-red-500',
		blue: 'text-blue-500',
		gray: 'text-gray-500'
	};

	const BORDER_COLORS = {
		green: 'border-[#00BD2F]',
		red: 'border-[#EB3223]',
		default: 'border-[#00273B66]'
	};

	const SHADOW_COLORS = {
		green: 'rgba(0,189,47,0.1)',
		red: 'rgba(235,50,35,0.03)',
		default: 'rgba(0,0,0,0.08)'
	};

	const colorClass = COLOR_CLASSES[routeStatus.color] ?? COLOR_CLASSES.gray;

	const isDeparting = status.status === 'Departing';

	const borderColor = isDeparting
		? BORDER_COLORS.red
		: (BORDER_COLORS[routeStatus.color] ?? BORDER_COLORS.default);

	const shadowColor = isDeparting
		? SHADOW_COLORS.red
		: (SHADOW_COLORS[routeStatus.color] ?? SHADOW_COLORS.default);
</script>

<div
	class={`m-4 flex items-center rounded-[16px] border-r-5 border-l-5 ${borderColor} bg-[rgba(255,255,255,0.85)] p-5`}
	style={`box-shadow: 0 0 10px 10px ${shadowColor}`}
>
	<div
		class="mr-5 flex min-w-28 items-center justify-center rounded-lg bg-[#00273B] px-4 py-3 text-2xl font-bold whitespace-nowrap text-white"
	>
		{dep.routeShortName}
	</div>

	<div
		class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 overflow-hidden text-xl leading-tight"
	>
		<span class="truncate font-semibold whitespace-nowrap">{dep.tripHeadsign}</span>
		<span class="flex min-w-0 items-center gap-x-2 overflow-hidden whitespace-nowrap">
			<ChevronRight class={colorClass} />
			<span class="truncate">{dep.stopName}</span>
		</span>
	</div>

	<div class="ml-3 flex items-center gap-1">
		{#if status.status === 'Departing'}
			<div class="flex items-center">
				<ArrowUpLeft class={status.color} strokeWidth={2.3} size={28} />
				<span class="{status.color} text-xl font-bold whitespace-nowrap">{status.text}</span>
			</div>
		{:else if status.minutes !== null}
			{#if routeStatus.status && window.innerWidth >= 1200 && status.status !== 'Departing'}
				<div
					class={`text-${routeStatus.color}-500 mr-2 rounded-[10px] bg-[#00000009] px-3 py-2 text-center font-bold`}
				>
					{routeStatus.status}
				</div>
			{/if}
			<div class="whitepsace-nowrap flex items-center gap-1.5">
				<ArrowDownRight class={colorClass} strokeWidth={2.3} size={28} />
				<span class="text-lg whitespace-nowrap">{status.text}</span>
				<span class={`text-${routeStatus.color}-500 text-3xl font-bold`}>{status.minutes}</span>
				<span class="text-lg">min</span>
			</div>
		{/if}

		{#if status.status === 'Departing' || status.minutes !== null}
			<ChevronRight class="text-gray-400" />
		{/if}

		<div class="flex flex-col items-end">
			<span class="text-4xl font-bold whitespace-nowrap">{status.displayTime}</span>
			{#if routeStatus.status && window.innerWidth < 1200 && status.status !== 'Departing'}
				<span class={`text-${routeStatus.color}-500 text-lg font-medium`}>
					{routeStatus.status}
				</span>
			{/if}
		</div>
	</div>
</div>
