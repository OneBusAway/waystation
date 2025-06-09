<script>
	let { situations = [] } = $props();

	const title = $derived(situations.length > 0 ? situations[0].summary?.value || '' : '');
	const description = $derived(situations.length > 0 ? situations[0].description?.value || '' : '');
</script>

<div class="mx-0 my-9 mr-4 p-0">
	{#if situations.length > 0}
		<div class="mb-4 flex items-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mr-4 h-20 w-20 flex-shrink-0 text-[#ff2d2d]"
				viewBox="0 0 24 24"
				fill="none"
			>
				<path
					d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<circle cx="12" cy="17" r="1" fill="currentColor" />
				<line
					x1="12"
					y1="9"
					x2="12"
					y2="13"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>

			<h2 class="text-4xl leading-[2.5rem] font-extrabold text-gray-900">
				SCHEDULED<br />MAINTENANCE
			</h2>
		</div>

		<div class="rounded-lg bg-gradient-to-r from-[#499430] to-[#76984f] p-4 opacity-80">
			<div class="mb-3 text-2xl font-extrabold text-white">
				{title}
			</div>

			<div class="text-lg font-normal text-white">
				{description}
			</div>
		</div>
	{/if}
</div>
