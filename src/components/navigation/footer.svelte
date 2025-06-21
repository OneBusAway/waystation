<script>
	let { stops } = $props();
</script>

<div class="bg-gray-300 p-3 text-black">
	<div class="flex items-center justify-between">
		<div class="flex items-center">
			<span class="ml-2 text-sm">Waystation by Open Transit Software Foundation</span>
		</div>
		<div class="text-right text-sm">
			{#each stops as stop, i (stop.code)}
				Stop No. {stop.code} - {stop.name}
				{#if i < stops.length - 1}
					<span class="mx-2">•</span>
				{/if}
			{/each}
		</div>
	</div>
</div>
