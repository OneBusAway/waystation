<script>
	import Sidebar from '$components/navigation/sidebar.svelte';

	let { data } = $props();
	let agencies = $derived(data.agencies);
	let selectedAgencyId = $derived(data.selectedAgencyId);
	let stopIDs = $derived(data.stopIDs);
	let selectedAgency = $derived(agencies.find((a) => a.id === selectedAgencyId));
</script>

<div class="flex h-screen overflow-hidden bg-gray-50">
	<!-- Sidebar -->
	<Sidebar {agencies} {selectedAgencyId} />

	<!-- Detail pane -->
	<main class="flex flex-1 flex-col overflow-hidden">
		{#if !selectedAgencyId}
			<div class="flex flex-1 items-center justify-center text-sm text-gray-400">
				Select an agency to view its stops.
			</div>
		{:else if !selectedAgency}
			<div class="flex flex-1 items-center justify-center text-sm text-gray-400">
				Agency not found.
			</div>
		{:else}
			<div class="flex-1 overflow-y-auto">
				<div class="border-b border-gray-200 bg-white px-6 py-4">
					<h1 class="text-base font-semibold text-gray-900">{selectedAgency.name}</h1>
					<p class="text-sm text-gray-500">{stopIDs.length} stops</p>
				</div>
				<div class="px-6 py-4">
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
									<td colspan="2" class="py-6 text-center text-sm text-gray-400">No stops found.</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>
