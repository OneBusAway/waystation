<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import { onMount } from 'svelte';
	import { formatSeconds } from '$lib/formatters';
	import { setLocale } from '$lib/paraglide/runtime';
	import { Power, Plus, Minus } from '@lucide/svelte';

	import Header from '$components/navigation/header.svelte';

	let { data } = $props();

	let localConfig = $state({
		maxDepartures: 4,
		updateInterval: 30
	});

	let runningTime = $state(0);
	let selector = $state('en');
	let fallback = 'https://onebusaway.org/wp-content/uploads/oba_logo-1.png';

	async function saveChanges() {
		setLocale(selector);

		await fetch('/api/config', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(localConfig)
		});
	}

	async function resetChanges() {
		selector = 'en';

		localConfig = {
			maxDepartures: 4,
			updateInterval: 30
		};

		saveChanges();
	}

	async function alter(key, type) {
		switch (type) {
			case 'add':
				localConfig[key]++;
				break;
			case 'minus':
				if (localConfig[key] > 1) localConfig[key]--;
				break;
		}
	}

	const upTime = () => {
		runningTime = Math.floor((Date.now() - data.startTime) / 1000);
		runningTime = formatSeconds(runningTime);
	};

	onMount(async () => {
		const req = await fetch('/api/config');
		let config = await req.json();
		if (config) localConfig = config;

		upTime();
		setInterval(upTime, 1000);
	});
</script>

<div class="flex h-screen flex-col">
	<Header title={PUBLIC_OBA_REGION_NAME} imageUrl={PUBLIC_OBA_LOGO_URL} />
	<div class="flex flex-1 flex-col items-center justify-center space-y-4">
		<div class="flex w-[65vw] items-center justify-between rounded-3xl bg-white p-2 text-2xl">
			<span class="ml-1 flex items-center gap-x-3 font-bold">
				<img src={PUBLIC_OBA_LOGO_URL || fallback} alt="Logo" class="h-[2.5vw] rounded-[0.629vw]" />
				Admin Dashboard
			</span>
			<span
				class="text-oba-green flex items-center gap-x-2 rounded-2xl bg-gray-100 p-3 text-xl whitespace-nowrap"
			>
				<Power size={22} strokeWidth={3.5} />
				{runningTime}
			</span>
		</div>
		<div class="flex w-[65vw] flex-row gap-3 rounded-3xl bg-white p-5 text-xl">
			<div class="flex w-[25%] flex-col gap-y-3 rounded-xl border-1 p-3">
				Display Language
				<select bind:value={selector}>
					<option value="en">English</option>
					<option value="ar">Arabic</option>
					<option value="es">Spanish</option>
					<option value="fr">French</option>
					<option value="de">German</option>
				</select>
			</div>
			<div class="flex w-[25%] flex-col gap-y-3 rounded-xl border-1 p-3">
				Departures Display Limit
				<span class="flex items-center gap-x-3 text-2xl font-bold whitespace-nowrap">
					<Minus
						class="rounded-md bg-gray-200"
						size={24}
						onclick={() => alter('maxDepartures', 'minus')}
					/>
					{localConfig.maxDepartures}
					<Plus
						class="rounded-md bg-gray-200"
						size={24}
						onclick={() => alter('maxDepartures', 'add')}
					/>
				</span>
			</div>
			<div class="flex w-[30%] flex-col gap-y-3 rounded-xl border-1 p-3">
				Screen Update Interval (seconds)
				<span class="flex items-center gap-x-3 text-2xl font-bold whitespace-nowrap">
					<Minus
						class="rounded-md bg-gray-200"
						size={24}
						onclick={() => alter('updateInterval', 'minus')}
					/>
					{localConfig.updateInterval}
					<Plus
						class="rounded-md bg-gray-200"
						size={24}
						onclick={() => alter('updateInterval', 'add')}
					/>
				</span>
			</div>
		</div>
		<div class="flex gap-x-10 rounded-3xl bg-white p-3 px-6 text-xl">
			<button type="button" class="text-brand-red cursor-pointer" onclick={resetChanges}>
				Set to default
			</button>
			<button type="button" class="text-oba-green cursor-pointer font-bold" onclick={saveChanges}>
				Save changes
			</button>
		</div>
	</div>
</div>
