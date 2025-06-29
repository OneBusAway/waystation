<script>
	import {
		formatArrivalStatus,
		formatRouteStatus,
		formatBorderColor,
		formatShadowColor,
		formatTextColor
	} from '$lib/formatters';
	import { ArrowDownRight, ArrowUpLeft, ChevronRight } from '@lucide/svelte';

	const { dep } = $props();

	const depStatus = formatArrivalStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);
	const routeStatus = formatRouteStatus(dep.predictedDepartureTime, dep.scheduledDepartureTime);

	const departure = {
		...depStatus,
		...formatBorderColor(depStatus.status, routeStatus.status),
		...formatShadowColor(depStatus.status, routeStatus.status),
		...formatTextColor(depStatus.status, routeStatus.status)
	};
</script>

<div
	class={`flex items-center rounded-[32px] border-x-7 ${departure.borderColor} m-4 bg-white/75 p-5`}
	style={`box-shadow: ${departure.shadowColor}`}
>
	<div
		class="bg-brand-darkerblue mr-5 flex min-w-42 items-center justify-center rounded-[20px] px-7 py-6 text-4xl font-black whitespace-nowrap text-white"
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

	<div class="ml-3 flex items-end gap-1">
		{#if departure.status === 'Departing'}
			<div class="flex items-center">
				<ArrowUpLeft strokeWidth={2.3} size={42} />
				<span class="ml-3 text-4xl font-bold whitespace-nowrap"> Departing now </span>
			</div>
		{:else}
			<div class="flex flex-col items-end">
				{#if departure.status === 'Scheduled'}
					<span class="text-6xl font-bold whitespace-nowrap">
						{departure.scheduledTime}
					</span>
				{:else if departure.status === 'Arriving'}
					<div class="flex items-center gap-3 font-semibold whitespace-nowrap">
						<ArrowDownRight class={departure.textColor} strokeWidth={2.3} size={42} />
						<span class="text-4xl whitespace-nowrap">Arriving in</span>
						<span class={`${departure.textColor} text-5xl font-bold`}>
							{departure.eta}
						</span>
						<span class="text-4xl">min</span>
					</div>
				{/if}

				{#if routeStatus.tag}
					<span class={`${departure.textColor} text-3xl font-bold`}>
						{routeStatus.tag}
					</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
