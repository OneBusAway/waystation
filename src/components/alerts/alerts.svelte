<script>
	import {
		formatTimestamp,
		validateTimestamp,
		formatReasonType,
		formatSeverityType
	} from '$lib/formatters';

	let { situations = [] } = $props();

	const situation = situations[0] ?? {};
	const activeWindow = situation.activeWindows?.[0] ?? {};

	const title = $derived(situation.summary?.value ?? '');

	const dateStart = formatTimestamp(activeWindow.from ?? '');
	const dateEnd = formatTimestamp(activeWindow.to ?? '');

	const reason = formatReasonType(situation.reason);
	const severity = formatSeverityType(situation.severity);

	const gray_bg = 'bg-[rgba(0,39,59,0.08)] font-bold px-5.5 py-1.5 corner rounded-[10px]';
</script>

{#if title}
	<div class="m-5">
		<div
			class={`${gray_bg} border-r-5 border-l-5 border-[#FFBB00] bg-white py-5.5 text-[#003956]`}
			style="box-shadow: 0 0 10px 1px rgba(0,0,0,0.25);"
		>
			<div class="mb-4 flex flex-wrap items-center gap-3 text-lg whitespace-nowrap">
				<span class={`${gray_bg} text-red-400`}>ALERT</span>
				<span class={`${gray_bg} whitespace-nowrap text-[#003956]`}
					>Reason: <span class="text-[#008993]">{reason}</span></span
				>
				<span class={`${gray_bg} whitespace-nowrap text-[#003956]`}
					>Severity: <span class="text-[#009333]">{severity}</span></span
				>
			</div>

			<div class="mb-3 text-2xl font-extrabold">
				{title}
			</div>

			{#if validateTimestamp(dateStart) && validateTimestamp(dateEnd)}
				<div class={`${gray_bg} flex items-center justify-center text-lg`}>
					<span class="text-xl whitespace-nowrap"
						><span class="text-[#FF5E51]">{dateStart}</span> ➔
						<span class="text-[#FF5E51]">{dateEnd}</span></span
					>
				</div>
			{/if}
		</div>
	</div>
{/if}
