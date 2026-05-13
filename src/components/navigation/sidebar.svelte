<script>
	let { agencies, selectedAgencyId } = $props();
</script>

<aside class="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
	<div class="px-4 pt-5 pb-3">
		<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Agencies</p>
	</div>
	<nav class="flex-1 overflow-y-auto">
		{#each agencies as agency (agency.id)}
			<a
				href="/?agency={encodeURIComponent(agency.id)}"
				aria-current={agency.id === selectedAgencyId ? 'page' : undefined}
				class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors {agency.id ===
				selectedAgencyId
					? 'bg-brand-lightgray text-brand-darkblue font-semibold'
					: 'text-gray-700 hover:bg-gray-50'}"
			>
				<span
					class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600"
				>
					{agency.id}
				</span>
				{agency.name}
			</a>
		{/each}
	</nav>
</aside>
