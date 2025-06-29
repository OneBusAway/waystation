<script>
	import { formatTimestamp, validateTimestamp } from '$lib/formatters';

	let { situations = [] } = $props();

	const situation = situations[0] ?? {};
	const activeWindow = situation.activeWindows?.[0] ?? {};

	const title = $derived(situation.summary?.value ?? '');

	const dateStart = formatTimestamp(activeWindow.from ?? '');
	const dateEnd = formatTimestamp(activeWindow.to ?? '');
</script>

{#if title}
	<div class="m-5">
		<div
			class="text-brand-darkerblue corner rounded-[24px] bg-white px-5.5 py-8 font-bold"
			style="box-shadow: 0 0 20px 1px rgba(0,0,0,0.15);"
		>
			<div class="text-brand-red flex items-center justify-center text-4xl font-bold">
				Your attention required!
			</div>

			<div class="my-6 text-4xl font-bold">
				{title}
			</div>

			{#if validateTimestamp(dateStart) && validateTimestamp(dateEnd)}
				<div class="flex items-center justify-center text-3xl">
					<span class="whitespace-nowrap">
						<span class="text-oba-green">{dateStart}</span>
						➔
						<span class="text-oba-green">{dateEnd}</span>
					</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
