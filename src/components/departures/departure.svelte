<script>
	import {
		formatArrivalStatus,
		formatRouteStatus,
		formatBorderColor,
		formatShadowColor,
		formatTextColor
	} from '$lib/formatters';

	import { ArrowDownRight, ArrowUpLeft, ChevronRight } from '@lucide/svelte';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as t from '$lib/paraglide/messages.js';

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
	class={`flex items-center rounded-[1.667vw] border-x-[0.365vw] ${departure.borderColor} mx-[1.042vw] my-[0.942vw] bg-white/75 p-[1.302vw]`}
	style={`box-shadow: ${departure.shadowColor}`}
>
	<div
		class="bg-brand-darkerblue mr-[1.0416vw] flex min-w-[8.75vw] items-center justify-center rounded-[1.041666vw] px-[1.45vw] py-[1.2vw] text-[1.93vw] leading-none font-black whitespace-nowrap text-white"
	>
		{dep.routeShortName}
	</div>

	<div
		class="flex min-w-0 flex-1 flex-wrap items-center gap-x-[0.4167vw] overflow-hidden text-[1.875vw] leading-tight"
	>
		<span class="truncate font-extrabold whitespace-nowrap">{dep.tripHeadsign}</span>
		<span
			class="flex min-w-0 items-center gap-x-[0.4167vw] overflow-hidden font-semibold whitespace-nowrap"
		>
			<ChevronRight class="h-[2.1875vw] w-[2.1875vw] text-gray-400" />
			<span class="truncate">{dep.stopName}</span>
		</span>
	</div>

	<div class="ml-[0.625vw] flex items-end gap-1">
		{#if departure.status === 'Departing'}
			<div class="flex items-center">
				<ArrowUpLeft class="h-[2.34375vw] w-[2.34375vw]" strokeWidth={2.3} />
				<span class="ml-[0.625vw] text-[2.5vw] font-bold whitespace-nowrap"
					>{t.departure_statusDeparting()}</span
				>
			</div>
		{:else}
			<div class="flex flex-col items-end gap-y-[0.52vw] leading-none">
				{#if departure.status === 'Scheduled'}
					<span class="text-[3.125vw] font-bold whitespace-nowrap">
						{departure.scheduledTime}
					</span>
				{:else if departure.status === 'Arriving'}
					<div class="flex items-center gap-[0.625vw] leading-none font-semibold whitespace-nowrap">
						{#if getLocale() !== 'ar'}
							<ArrowDownRight
								class={`${departure.textColor} h-[2.1875vw] w-[2.1875vw]`}
								strokeWidth={2.3}
							/>
							<span class="text-[1.875vw] whitespace-nowrap">{t.departure_statusArriving()}</span>
							<span class={`${departure.textColor} text-[2.5vw] font-bold`}>
								{departure.eta}
							</span>
							<span class="text-[1.875vw]">{t.departure_statusMinute()}</span>
						{:else}
							<ArrowDownRight
								class={`${departure.textColor} h-[2.1875vw] w-[2.1875vw]`}
								strokeWidth={2.3}
							/>
							<span class="text-[1.875vw]">{t.departure_statusMinute()}</span>
							<span class={`${departure.textColor} text-[2.5vw] font-bold`}>
								{departure.eta}
							</span>
							<span class="text-[1.875vw] whitespace-nowrap">{t.departure_statusArriving()}</span>
						{/if}
					</div>
				{/if}

				{#if routeStatus.tag}
					<span dir="auto" class={`${departure.textColor} text-[1.7625vw] leading-none font-bold`}>
						{routeStatus.tag}
					</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
