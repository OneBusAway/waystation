<script>
	let { stopIDs } = $props();
</script>

<table class="w-full border-collapse text-sm">
	<thead>
		<tr class="border-b border-gray-200">
			<th class="pb-2 text-left font-medium text-gray-900">Stop ID</th>
		</tr>
	</thead>
	<tbody>
		{#each stopIDs as stopID (stopID)}
			<tr class="border-b border-gray-100">
				<td class="py-2.5">
					<a href="/stops/{stopID}" class="text-brand-blue font-medium hover:underline">
						{stopID}
					</a>
				</td>
			</tr>
		{:else}
			<tr>
				<td colspan="2" class="py-6 text-center text-sm text-gray-400"> No stops found. </td>
			</tr>
		{/each}
	</tbody>
</table>
