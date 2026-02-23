<script>
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { translate, formatTimestamp } from '$lib/formatters';
	import { TriangleAlert } from '@lucide/svelte';

	import * as t from '$lib/paraglide/messages.js';

	let { situation = {}, displayMode } = $props();

	let title = $state('');
	let translatedTitle = $state('');

	$effect(() => {
		title = situation?.summary?.value?.trim?.() ?? '';

		if (getLocale() !== 'en') {
			translate(title, getLocale()).then((result) => {
				translatedTitle = result;
			});
		}
	});

	const activeWindow = situation?.activeWindows?.[0];
	const dateStart = formatTimestamp(activeWindow?.from);
	const dateEnd = formatTimestamp(activeWindow?.to);
</script>

{#if displayMode}
	<div
		class="text-brand-darkerblue m-[1.042vw] rounded-[1.25vw] bg-white px-[1.146vw] py-[1.667vw] leading-none font-bold"
		style="box-shadow: 0 0 1.042vw 0.052vw rgba(0,0,0,0.15);"
		dir="auto"
	>
		<div class="text-brand-red flex items-center justify-center text-[1.875vw] font-bold">
			{t.alerts_disclaimer()}
		</div>

		<div class="my-[1.25vw] text-[1.875vw] leading-[2.5vw] font-bold">
			{translatedTitle || title}
		</div>

		<div
			class="text-brand-darkblue flex flex-row justify-center gap-x-[1.302vw] text-center text-[1.875vw]"
		>
			{#if dateStart === dateEnd && dateStart !== 'Invalid Date'}
				<div class="flex flex-col items-center gap-y-[0.625vw]">
					{t.alerts_on()}
					<span class="text-oba-green font-extrabold">{dateStart}</span>
				</div>
			{:else}
				{#if dateStart !== 'Invalid Date'}
					<div class="flex flex-col items-center gap-y-[0.625vw]">
						{t.alerts_starting()}
						<span class="text-oba-green font-extrabold">{dateStart}</span>
					</div>
				{/if}

				{#if dateStart !== 'Invalid Date' && dateEnd !== 'Invalid Date'}
					<div
						class={`flex items-center ${getLocale() === 'ar' ? '[transform:rotate(180deg)]' : ' '}`}
					>
						➔
					</div>
				{/if}

				{#if dateEnd !== 'Invalid Date'}
					<div class="flex flex-col items-center gap-y-[0.625vw]">
						{t.alerts_ending()}
						<span class="text-oba-green font-extrabold">{dateEnd}</span>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{:else}
	<div
		class="h-[5.208vw] bg-gradient-to-t from-[rgb(209,213,220,0.99)] to-[rgb(209,213,220,0.05)]"
	></div>
	<div
		class="text-brand-darkerblue flex flex-row items-center gap-x-[2.083vw] bg-[rgb(209,213,220,0.975)] px-[1.667vw] py-[1.25vw] leading-[2.2vw] font-bold"
		dir="auto"
	>
		<TriangleAlert strokeWidth={2.3} class="text-brand-red h-[6.9vw] w-[6.9vw]" />

		<div class="flex flex-1 text-[1.875vw] font-bold">
			{translatedTitle || title}
		</div>

		<div
			class="text-brand-darkblue flex max-w-[30vw] min-w-0 gap-x-[1.042vw] text-center text-[1.875vw]"
		>
			{#if dateStart === dateEnd && dateStart !== 'Invalid Date'}
				<div class="flex flex-col items-center gap-y-[0.208vw]">
					{t.alerts_on()}
					<span class="text-oba-green font-extrabold">{dateStart}</span>
				</div>
			{:else}
				{#if dateStart !== 'Invalid Date'}
					<div class="flex flex-col items-center gap-y-[0.208vw]">
						{t.alerts_starting()}
						<span class="text-oba-green font-extrabold">{dateStart}</span>
					</div>
				{/if}

				{#if dateEnd !== 'Invalid Date'}
					<div class="flex flex-col items-center gap-y-[0.208vw]">
						{t.alerts_ending()}
						<span class="text-oba-green font-extrabold">{dateEnd}</span>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}
