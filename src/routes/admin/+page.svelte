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
	<div class="m-5 flex flex-1 flex-col items-center justify-center space-y-4">
		<div
			class="flex w-full max-w-7xl flex-col justify-between gap-3 rounded-3xl bg-white p-4 text-xl md:flex-row md:items-center md:text-2xl"
		>
			<span class="flex items-center gap-1 font-bold whitespace-nowrap lg:gap-2 lg:text-3xl">
				<Power class="text-oba-green size-5 lg:size-7" strokeWidth={3.5} />
				Uptime
			</span>
			<div
				class="text-md text-oba-green flex items-center justify-center gap-x-2 rounded-2xl bg-gray-100 p-3 md:text-lg lg:text-xl"
			>
				{runningTime}
			</div>
		</div>
		<div class="flex w-full max-w-7xl flex-col gap-3 rounded-3xl bg-white p-5 text-xl md:flex-row">
			<div class="flex w-full flex-col gap-y-3 rounded-xl border-4 border-gray-300 p-3">
				Display Language
				<select bind:value={selector} class="hover:cursor-pointer">
					<option value="en">English</option>
					<option value="ar">Arabic</option>
					<option value="es">Spanish</option>
					<option value="fr">French</option>
					<option value="de">German</option>
				</select>
			</div>
			<div class="flex w-full flex-col gap-y-3 rounded-xl border-4 border-gray-300 p-3">
				Departures Display Limit
				<span class="flex items-center gap-x-3 text-2xl font-bold whitespace-nowrap">
					<Minus
						class="rounded-md bg-gray-200 hover:cursor-pointer"
						size={24}
						onclick={() => alter('maxDepartures', 'minus')}
					/>
					{localConfig.maxDepartures}
					<Plus
						class="rounded-md bg-gray-200 hover:cursor-pointer"
						size={24}
						onclick={() => alter('maxDepartures', 'add')}
					/>
				</span>
			</div>
			<div class="flex w-full flex-col gap-y-3 rounded-xl border-4 border-gray-300 p-3">
				Screen Update Interval (seconds)
				<span class="flex items-center gap-x-3 text-2xl font-bold whitespace-nowrap">
					<Minus
						class="rounded-md bg-gray-200 hover:cursor-pointer"
						size={24}
						onclick={() => alter('updateInterval', 'minus')}
					/>
					{localConfig.updateInterval}
					<Plus
						class="rounded-md bg-gray-200 hover:cursor-pointer"
						size={24}
						onclick={() => alter('updateInterval', 'add')}
					/>
				</span>
			</div>
		</div>
		<div
			class="flex w-full max-w-7xl justify-around gap-x-10 rounded-3xl bg-white p-3 px-6 text-xl"
		>
			<button
				type="button"
				class="text-brand-red hover:bg-brand-red/10 cursor-pointer rounded-4xl px-5 py-1"
				onclick={resetChanges}
			>
				Set to default
			</button>
			<button
				type="button"
				class="text-oba-green hover:bg-oba-green/10 cursor-pointer rounded-4xl px-5 py-1 font-bold"
				onclick={saveChanges}
			>
				Save changes
			</button>
		</div>
	</div>
</div>
