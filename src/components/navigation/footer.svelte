<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let stopName = $state('Loading stop information...');
	let stopCode = $state('');

	async function fetchStopInfo() {
		try {
			const response = await fetch(`api/oba/stops`);
			if (!response.ok) throw new Error('Failed to fetch stop information');
			const data = await response.json();
			if (data) {
				stopName = data.name;
				stopCode = data.code;
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error fetching stop information:', error);
			stopName = 'Unknown Stop';
			return false;
		}
	}

	onMount(async () => {
		if (browser) {
			await fetchStopInfo();
		}
	});
</script>

<div class="bg-gray-300 p-3 text-black">
	<div class="flex items-center justify-between">
		<div class="flex items-center">
			<span class="ml-2 text-sm">Waystation by Open Transit Software Foundation</span>
		</div>
		<div class="text-sm">
			Stop No. {stopCode} - {stopName}
		</div>
	</div>
</div>
