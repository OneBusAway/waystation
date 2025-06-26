<script>
	import { formatTimestamp, validateTimestamp } from '$lib/formatters';

	let { situations = [] } = $props();

	const situation = situations[0] ?? {};
	const activeWindow = situation.activeWindows?.[0] ?? {};

	const title = $derived(situation.summary?.value ?? '');

	const dateStart = formatTimestamp(activeWindow.from ?? '');
	const dateEnd = formatTimestamp(activeWindow.to ?? '');

	const gray_bg = 'bg-[rgba(0,39,59,0.05)] font-bold px-5.5 py-1.5 corner rounded-[10px]';
</script>

{#if title}
	<div class="m-5">
		<div
			class={`${gray_bg} bg-white py-5.5 text-[#003956]`}
			style="box-shadow: 0 0 20px 1px rgba(0,0,0,0.15);"
		>
			<div class="mb-3 flex items-center justify-center text-3xl font-extrabold text-[#FF5E51]">
				Your attention required!
			</div>

			<div class="mb-3 text-3xl font-extrabold">
				{title}
			</div>

			{#if validateTimestamp(dateStart) && validateTimestamp(dateEnd)}
				<div class={`${gray_bg} flex items-center justify-center text-2xl`}>
					<span class="whitespace-nowrap"
						><span class="text-[#4BA12C]">{dateStart}</span> ➔
						<span class="text-[#4BA12C]">{dateEnd}</span></span
					>
				</div>
			{/if}
		</div>
	</div>
{/if}
