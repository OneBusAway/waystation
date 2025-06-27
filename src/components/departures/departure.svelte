<script>
	import { formatArrivalStatus, formatRouteStatus } from '$lib/formatters';
	import { ArrowDownRight, ArrowUpLeft, ChevronRight } from '@lucide/svelte';

	const { dep } = $props();

	const status = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
	const routeStatus = formatRouteStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);

	const COLOR_CLASSES = {
		green: 'text-green-500',
		red: 'text-red-500',
		blue: 'text-[#0087E8]',
		gray: 'text-[#8D8D8D]'
	};

	const BORDER_COLORS = {
		green: 'border-[#00BD2F]',
		red: 'border-[#EB3223]',
		blue: 'border-[#0087E8]',
		default: 'border-[#00273B66]'
	};

	const SHADOW_COLORS = {
		green: 'rgba(0,189,47,0.1)',
		red: 'rgba(235,50,35,0.03)',
		blue: 'rgba(0,149,255,0.07)',
		default: 'rgba(0,0,0,0.08)'
	};

	const colorClass = COLOR_CLASSES[routeStatus.color] ?? COLOR_CLASSES.gray;

	const isDeparting = status.status === 'Departing';

	const borderColor = isDeparting
		? BORDER_COLORS.default
		: (BORDER_COLORS[routeStatus.color] ?? BORDER_COLORS.default);

	const shadowColor = isDeparting
		? SHADOW_COLORS.default
		: (SHADOW_COLORS[routeStatus.color] ?? SHADOW_COLORS.default);
</script>

<div
	class={`m-4 flex items-center rounded-[32px] border-r-7 border-l-7 ${borderColor} bg-[rgba(255,255,255,0.85)] p-5`}
	style={`box-shadow: 0 0 10px 10px ${shadowColor}`}
>
	<div
		class="mr-5 flex min-w-42 items-center justify-center rounded-[20px] bg-[#00273B] px-7 py-6 text-4xl font-black whitespace-nowrap text-white"
	>
		{dep.routeShortName}
	</div>

	<div
		class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 overflow-hidden text-4xl leading-tight"
	>
		<span class="truncate font-extrabold whitespace-nowrap">{dep.tripHeadsign}</span>
		<span class="flex min-w-0 items-center gap-x-2 overflow-hidden font-semibold whitespace-nowrap">
			<ChevronRight class="text-gray-400" size={45} />
			<span class="truncate">{dep.stopName}</span>
		</span>
	</div>

	<div class="ml-3 flex items-center gap-1">
		{#if status.status === 'Departing'}
			<div class="flex items-center">
				<ArrowUpLeft strokeWidth={2.3} size={42} />
				<span class="ml-3 text-4xl font-bold whitespace-nowrap">{status.text}</span>
			</div>
		{:else if status.minutes !== null}
			<div class="flex items-center gap-3 font-semibold whitespace-nowrap">
				<ArrowDownRight class={colorClass} strokeWidth={2.3} size={42} />
				<span class="text-4xl whitespace-nowrap">{status.text}</span>
				<span class={`${COLOR_CLASSES[routeStatus.color]} text-5xl font-bold`}
					>{status.minutes}</span
				>
				<span class="text-4xl">min</span>
			</div>
		{/if}

		{#if status.status === 'Arriving' && (routeStatus.status || status.status === 'Scheduled')}
			<ChevronRight size={36} class="text-gray-400" />
		{/if}

		<div class="flex flex-col items-end">
			{#if status.status === 'Scheduled'}
				<span class="text-6xl font-bold whitespace-nowrap">{status.displayTime}</span>
			{/if}
			{#if routeStatus.status && status.status !== 'Departing'}
				<span class={`${COLOR_CLASSES[routeStatus.color]} text-3xl font-bold`}>
					{routeStatus.status}
				</span>
			{/if}
		</div>
	</div>
</div>
