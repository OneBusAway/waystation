<script>
	let { stops } = $props();
	import * as t from '$lib/paraglide/messages.js';
</script>

<div class="bg-gray-300 p-3 text-black">
	<div class="flex items-center justify-between">
		<div class="flex items-center">
			<span class="ml-2 text-sm">{t.footer_watermark()}</span>
		</div>
		<div class="right-alignment text-right text-sm">
			{#each stops as stop, i (stop.code)}
				{t.footer_stopNumber({ stopCode: stop.code, stopName: stop.name })}
				{#if i < stops.length - 1}
					<span class="mx-2">•</span>
				{/if}
			{/each}
		</div>
	</div>
</div>
