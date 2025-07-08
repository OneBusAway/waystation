<script>
	import { translateText, formatTimestamp } from '$lib/formatters';
	import { languageTag } from '$lib/paraglide/runtime.js';
	import * as t from '$lib/paraglide/messages.js';

	let { situations = [] } = $props();

	let title = $state(situations[0]?.summary?.value?.trim?.() ?? '');
	let translatedTitle = $state(title);

	$effect(() => {
		if (languageTag() !== 'en') {
			translateText(title, languageTag()).then((result) => {
				translatedTitle = result;
			});
		}
	});

	const activeWindow = situations[0]?.activeWindows?.[0];
	const dateStart = formatTimestamp(activeWindow?.from);
	const dateEnd = formatTimestamp(activeWindow?.to);

	const alignment = languageTag() !== 'ar' ? `` : `right-alignment leading-12`;
</script>

<div class="m-5">
	<div
		class="text-brand-darkerblue rounded-[24px] bg-white px-5.5 py-8 font-bold"
		style="box-shadow: 0 0 20px 1px rgba(0,0,0,0.15);"
	>
		<div class={`text-brand-red flex items-center justify-center text-4xl font-bold  ${alignment}`}>
			{t.alerts_disclaimer()}
		</div>

		<div class={`my-6 text-4xl font-bold ${alignment}`}>
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
</div>
