<script>
	import Sidebar from '$components/navigation/sidebar.svelte';
	import StopIdTable from '$components/stops/stopIdTable.svelte';
	import StopTable from '$components/stops/stopTable.svelte';

	let { data } = $props();
	let agencies = $derived(data.agencies);
	let selectedAgencyId = $derived(data.selectedAgencyId);
	let stops = $derived(data.stops);
	let stopIDs = $derived(data.stopIDs);
	let selectedAgency = $derived(agencies.find((a) => a.id === selectedAgencyId));

	let query = $state('');
	$effect(() => {
		selectedAgencyId;
		query = '';
	});

	let normalizedQuery = $derived(query.trim().toLowerCase());

	function matchesStop(stop) {
		return (
			stop.id.toLowerCase().includes(normalizedQuery) ||
			(stop.name ?? '').toLowerCase().includes(normalizedQuery)
		);
	}

	function matchesStopID(id) {
		return id.toLowerCase().includes(normalizedQuery);
	}

	let filteredStops = $derived(normalizedQuery ? (stops?.filter(matchesStop) ?? []) : stops);
	let filteredStopIDs = $derived(normalizedQuery ? stopIDs.filter(matchesStopID) : stopIDs);
	let totalCount = $derived(stops ? stops.length : stopIDs.length);
	let visibleCount = $derived(stops ? filteredStops.length : filteredStopIDs.length);
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
				<div class="space-y-3 border-b border-gray-200 bg-white px-6 py-4">
					<div>
						<h1 class="text-base font-semibold text-gray-900">{selectedAgency.name}</h1>
						<p class="text-sm text-gray-500">
							{#if normalizedQuery}
								{visibleCount} of {totalCount} stops
							{:else}
								{totalCount} stops
							{/if}
						</p>
					</div>
					<input
						type="search"
						bind:value={query}
						placeholder="Search stops…"
						aria-label="Search stops"
						class="focus:border-brand-blue focus:ring-brand-blue/20 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
					/>
				</div>
				<div class="px-6 py-4">
					{#if stops}
						<StopTable stops={filteredStops} />
					{:else}
						<StopIdTable stopIDs={filteredStopIDs} />
					{/if}
				</div>
			</div>
		{/if}
	</main>
</div>
