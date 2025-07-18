<script>
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { translate, formatTimestamp } from '$lib/formatters';
	import { TriangleAlert } from '@lucide/svelte';

	import * as t from '$lib/paraglide/messages.js';

	let { situations = [], displayMode } = $props();

	let title = $state(situations[0]?.summary?.value?.trim?.() ?? '');
	let translatedTitle = $state(title);

	$effect(() => {
		if (getLocale() !== 'en') {
			translate(title, getLocale()).then((result) => {
				translatedTitle = result;
			});
		}
	});

	const activeWindow = situations[0]?.activeWindows?.[0];
	const dateStart = formatTimestamp(activeWindow?.from);
	const dateEnd = formatTimestamp(activeWindow?.to);
</script>

{#if displayMode}
	<div
		class="text-brand-darkerblue m-5 rounded-[24px] bg-white px-5.5 py-8 font-bold"
		style="box-shadow: 0 0 20px 1px rgba(0,0,0,0.15);"
		dir="auto"
	>
		<div class="text-brand-red flex items-center justify-center text-4xl font-bold">
			{t.alerts_disclaimer()}
		</div>

		<div class="my-6 text-4xl leading-12 font-bold">
			{translatedTitle || title}
		</div>

		<div class="text-brand-darkblue flex flex-row justify-center gap-x-5 text-center text-4xl">
			{#if dateStart !== 'Invalid Date'}
				<div class="flex flex-col items-center gap-y-3">
					{t.alerts_starting()}
					<span class="text-oba-green font-extrabold">{dateStart}</span>
				</div>
			{/if}

			{#if dateStart !== 'Invalid Date' && dateEnd !== 'Invalid Date'}
				<div class="flex items-center">➔</div>
			{/if}

			{#if dateEnd !== 'Invalid Date'}
				<div class="flex flex-col items-center gap-y-3">
					{t.alerts_ending()}
					<span class="text-oba-green font-extrabold">{dateEnd}</span>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="h-25 bg-gradient-to-t from-[rgb(209,213,220,0.99)] to-[rgb(209,213,220,0.05)]"></div>
	<div
		class="text-brand-darkerblue flex flex-row items-center gap-x-10 bg-[rgb(209,213,220,0.975)] px-8 py-6 font-bold"
		dir="auto"
	>
		<TriangleAlert strokeWidth={2.3} size={128} class="text-brand-red" />

		<div class="flex flex-1 text-4xl font-bold">
			{translatedTitle || title}
		</div>

		<div class="text-brand-darkblue flex min-w-0 gap-x-5 text-center text-4xl">
			{#if dateStart !== 'Invalid Date'}
				<div class="flex flex-col items-center gap-y-1">
					{t.alerts_starting()}
					<span class="text-oba-green font-extrabold">{dateStart}</span>
				</div>
			{/if}

			{#if dateEnd !== 'Invalid Date'}
				<div class="flex flex-col items-center gap-y-1">
					{t.alerts_ending()}
					<span class="text-oba-green font-extrabold">{dateEnd}</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
