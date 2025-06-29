<script>
	import { formatTimestamp } from '$lib/formatters';

	let { situations = [] } = $props();

	const situation = situations[0];
	const summary = situation?.summary;
	const activeWindow = situation?.activeWindows?.[0];

	const title = summary?.value?.trim() ?? '';
	const dateStart = formatTimestamp(activeWindow?.from);
	const dateEnd = formatTimestamp(activeWindow?.to);
</script>

{#if title}
	<div class="m-5">
		<div
			class="text-brand-darkerblue rounded-[24px] bg-white px-5.5 py-8 font-bold"
			style="box-shadow: 0 0 20px 1px rgba(0,0,0,0.15);"
		>
			<div class="text-brand-red flex items-center justify-center text-4xl font-bold">
				Your attention required!
			</div>

			<div class="my-6 text-4xl font-bold">
				{title}
			</div>

			<div class="text-brand-darkblue flex flex-row justify-center gap-x-5 text-center text-4xl">
				{#if dateStart !== 'Invalid Date'}
					<div class="flex flex-col items-center">
						Starting
						<span class="text-oba-green font-extrabold">{dateStart}</span>
					</div>
				{/if}

				{#if dateStart !== 'Invalid Date' && dateEnd !== 'Invalid Date'}
					<div class="flex items-center">➔</div>
				{/if}

				{#if dateEnd !== 'Invalid Date'}
					<div class="flex flex-col items-center">
						Ending
						<span class="text-oba-green font-extrabold">{dateEnd}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
