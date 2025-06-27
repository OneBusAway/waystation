<script>
	import { formatTimestamp, validateTimestamp } from '$lib/formatters';

	let { situations = [] } = $props();

	const situation = situations[0] ?? {};
	const activeWindow = situation.activeWindows?.[0] ?? {};

	const title = $derived(situation.summary?.value ?? '');

	const dateStart = formatTimestamp(activeWindow.from ?? '');
	const dateEnd = formatTimestamp(activeWindow.to ?? '');

	const gray_bg = 'bg-[rgba(0,39,59,0.05)] font-bold px-5.5 py-1.5 corner rounded-[24px]';
</script>

{#if title}
	<div class="m-5">
		<div
			class={`${gray_bg} bg-white py-5.5 text-[#003956]`}
			style="box-shadow: 0 0 20px 1px rgba(0,0,0,0.15);"
		>
			<div class="flex items-center justify-center text-4xl font-bold text-[#FF5E51]">
				Your attention required!
			</div>

			<div class="my-6 text-4xl font-bold">
				{title}
			</div>

			{#if validateTimestamp(dateStart) && validateTimestamp(dateEnd)}
				<div class={`${gray_bg} flex items-center justify-center text-3xl`}>
					<span class="whitespace-nowrap"
						><span class="text-[#4BA12C]">{dateStart}</span> ➔
						<span class="text-[#4BA12C]">{dateEnd}</span></span
					>
				</div>
			{/if}
		</div>
	</div>
{/if}
