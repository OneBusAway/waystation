<script>
	let { stops } = $props();
	import * as t from '$lib/paraglide/messages.js';
</script>

<div class="flex items-center justify-between bg-gray-300 p-[0.625vw] text-black">
	<div class="flex items-center">
		<span class="text-[0.729vw]">{t.footer_watermark()}</span>
	</div>
	<div dir="auto" class="text-[0.729vw]">
		{#each stops as stop, i (stop.code)}
			{t.footer_stopNumber({ stopCode: stop.code, stopName: stop.name })}
			{#if i < stops.length - 1}
				<span class="mx-[0.417vw]">•</span>
			{/if}
		{/each}
	</div>
</div>
