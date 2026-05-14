<script>
	let { stops } = $props();
</script>

<table class="w-full border-collapse text-sm">
	<thead>
		<tr class="border-b border-gray-200">
			<th class="pb-2 text-left font-medium text-gray-900">Stop ID</th>
			<th class="pb-2 text-left font-medium text-gray-900">Name</th>
		</tr>
	</thead>
	<tbody>
		{#each stops as stop (stop.id)}
			<tr class="border-b border-gray-100">
				<td class="py-2.5">
					<a href="/stops/{stop.id}" class="text-brand-blue font-medium hover:underline">
						{stop.id}
					</a>
				</td>
				<td class="py-2.5">
					{stop.name}
				</td>
			</tr>
		{:else}
			<tr>
				<td colspan="2" class="py-6 text-center text-sm text-gray-400"> No stops found. </td>
			</tr>
		{/each}
	</tbody>
</table>
