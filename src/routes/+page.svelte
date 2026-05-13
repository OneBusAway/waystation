<script>
	let { data } = $props();
	let agencies = $derived(data.agencies);
	let selectedAgencyId = $derived(data.selectedAgencyId);
	let stopIDs = $derived(data.stopIDs);
	let selectedAgency = $derived(agencies.find((a) => a.id === selectedAgencyId));
</script>

<div class="flex h-screen overflow-hidden bg-gray-50">
	<!-- Sidebar -->
	<aside class="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
		<div class="px-4 pt-5 pb-3">
			<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Agencies</p>
		</div>
		<nav class="flex-1 overflow-y-auto">
			{#each agencies as agency (agency.id)}
				<a
					href="/?agency={agency.id}"
					class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors {agency.id ===
					selectedAgencyId
						? 'bg-brand-lightgray text-brand-darkblue font-semibold'
						: 'text-gray-700 hover:bg-gray-50'}"
				>
					<span
						class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600"
					>
						{agency.name.charAt(0)}
					</span>
					{agency.name}
				</a>
			{/each}
		</nav>
	</aside>

	<!-- Detail pane -->
	<main class="flex flex-1 flex-col overflow-hidden">
		{#if !selectedAgency}
			<div class="flex flex-1 items-center justify-center text-sm text-gray-400">
				Select an agency to view its stops.
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
								<th class="pb-2 text-right font-medium text-gray-900">
									<span class="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{#each stopIDs as stopID (stopID)}
								<tr class="border-b border-gray-100">
									<td class="py-2.5 font-mono text-gray-700">{stopID}</td>
									<td class="py-2.5 text-right">
										<a href="/stops/{stopID}" class="text-brand-blue font-medium hover:underline">
											View
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>
