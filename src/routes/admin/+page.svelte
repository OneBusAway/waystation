<script>
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatSeconds } from '$lib/formatters';
	import { COLOR_MODES, THEMES, normalizeConfig } from '$lib/config/defaults.js';
	import { setLocale } from '$lib/paraglide/runtime';
	import {
		SITE_TOKENS,
		BOARD_TOKENS,
		isValidLogoUrl,
		validateBranding
	} from '$lib/config/branding.js';
	import { Power, Plus, Minus } from '@lucide/svelte';

	import Header from '$components/navigation/header.svelte';

	let { data } = $props();

	let localConfig = $state(normalizeConfig(data.config));

	let runningTime = $state(0);
	let selector = $state('en');
	let saveErrors = $state([]);

	// Live preview of the unsaved branding; `data` carries the env-var fallbacks from the layout.
	// Only preview a complete http(s) URL so partial keystrokes never become <img src> requests.
	const logoUrl = $derived(
		isValidLogoUrl(localConfig.branding.logoUrl) ? localConfig.branding.logoUrl : data.logoUrl
	);
	const regionName = $derived(localConfig.branding.regionName || data.regionName);

	async function saveChanges() {
		// Same rules the server applies, so the messages match by construction.
		saveErrors = validateBranding(localConfig.branding);
		if (saveErrors.length) return;

		setLocale(selector);

		try {
			const res = await fetch('/api/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(localConfig)
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || res.statusText || `HTTP ${res.status}`);
			}
		} catch (error) {
			alert(`Failed to save configuration: ${error.message}`);
			return;
		}

		// Re-run the root layout load so the title, favicon, and branding stylesheet reflect the save,
		// then resync the form with what the server actually persisted (e.g. trimmed names).
		await invalidate('app:config');
		localConfig = normalizeConfig(data.config);
	}

	async function resetChanges() {
		selector = 'en';
		localConfig = normalizeConfig();
		await saveChanges();
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

	const THEME_LABELS = { system: 'Follow system', light: 'Light', dark: 'Dark' };
	const COLOR_MODE_LABELS = { color: 'Color', mono: 'Monochromatic' };

	onMount(() => {
		upTime();
		setInterval(upTime, 1000);
	});
</script>

<div class="flex min-h-screen flex-col">
	<Header title={regionName} imageUrl={logoUrl} />
	<div class="m-5 flex flex-1 flex-col items-center justify-center space-y-4">
		<div
			class="flex w-full max-w-7xl flex-col justify-between gap-3 rounded-3xl bg-white p-4 text-xl md:flex-row md:items-center md:text-2xl"
		>
			<span class="flex items-center gap-x-2 font-bold whitespace-nowrap lg:gap-x-3 lg:text-3xl">
				<img src={logoUrl} alt="Logo" class="h-6 rounded-md lg:h-8" />
				Admin Dashboard
			</span>
			<div
				class="text-oba-green flex items-center justify-center gap-x-2 rounded-2xl bg-gray-100 p-3 text-base md:text-lg lg:text-xl"
			>
				<Power class="text-oba-green size-5 lg:size-7" strokeWidth={3.5} />
				{runningTime}
			</div>
		</div>

		{#snippet stepper(label, key)}
			<div class="flex w-full flex-col gap-y-3 rounded-xl border-4 border-gray-300 p-3">
				<span>{label}</span>
				<span class="flex items-center gap-x-3 text-2xl font-bold whitespace-nowrap">
					<Minus
						class="cursor-pointer rounded-md bg-gray-200"
						size={24}
						aria-label="Decrease {label.toLowerCase()}"
						onclick={() => alter(key, 'minus')}
					/>
					{localConfig[key]}
					<Plus
						class="cursor-pointer rounded-md bg-gray-200"
						size={24}
						aria-label="Increase {label.toLowerCase()}"
						onclick={() => alter(key, 'add')}
					/>
				</span>
			</div>
		{/snippet}

		{#snippet colorPicker(key, token)}
			<div class="flex flex-col gap-y-2 rounded-xl border-4 border-gray-300 p-3">
				<label for="color-{key}" class="text-sm font-medium">{token.label}</label>
				<div class="flex items-center gap-x-3">
					<input
						id="color-{key}"
						type="color"
						value={localConfig.branding[key] || token.defaultHex}
						onchange={(e) => {
							localConfig.branding[key] = e.target.value;
						}}
						class="h-9 w-14 cursor-pointer rounded border border-gray-200"
					/>
					{#if localConfig.branding[key]}
						<button
							type="button"
							class="text-sm text-gray-400 hover:text-red-500"
							onclick={() => {
								localConfig.branding[key] = '';
							}}>Reset</button
						>
					{:else}
						<span class="text-sm text-gray-400">Default</span>
					{/if}
				</div>
			</div>
		{/snippet}

		<div class="flex w-full max-w-7xl flex-col gap-3 rounded-3xl bg-white p-5 text-xl md:flex-row">
			<div class="flex w-full flex-col gap-y-3 rounded-xl border-4 border-gray-300 p-3">
				<label for="language-select">Display Language</label>
				<select id="language-select" bind:value={selector}>
					<option value="en">English</option>
					<option value="ar">Arabic</option>
					<option value="es">Spanish</option>
					<option value="fr">French</option>
					<option value="de">German</option>
				</select>
			</div>
			{@render stepper('Departures Display Limit', 'maxDepartures')}
			{@render stepper('Screen Update Interval (seconds)', 'updateInterval')}
			<div class="flex w-full flex-col gap-y-3 rounded-xl border-4 border-gray-300 p-3">
				<label for="show-occupancy-status">Show Occupancy Status</label>
				<input
					id="show-occupancy-status"
					type="checkbox"
					bind:checked={localConfig.showOccupancyStatus}
					class="size-6"
				/>
			</div>
		</div>
		{#snippet chooser(label, key, options, labels)}
			<div class="flex w-full flex-col gap-y-3 rounded-xl border-4 border-gray-300 p-3">
				<label for="{key}-select">{label}</label>
				<select id="{key}-select" bind:value={localConfig[key]}>
					{#each options as option (option)}
						<option value={option}>{labels[option]}</option>
					{/each}
				</select>
			</div>
		{/snippet}

		<div class="flex w-full max-w-7xl flex-col gap-3 rounded-3xl bg-white p-5 text-xl md:flex-row">
			{@render chooser('Board Theme', 'theme', THEMES, THEME_LABELS)}
			{@render chooser('Board Colors', 'colorMode', COLOR_MODES, COLOR_MODE_LABELS)}
		</div>

		<!-- Board Branding -->
		<div class="flex w-full max-w-7xl flex-col gap-3 rounded-3xl bg-white p-5 text-xl">
			<h2 class="text-lg font-bold text-gray-700">Board Branding</h2>
			<p class="text-sm text-gray-500">
				Overrides apply to both the light and dark board themes. Monochromatic mode still collapses
				status colors to the text color.
			</p>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{#each Object.entries(BOARD_TOKENS) as [key, token] (key)}
					{@render colorPicker(key, token)}
				{/each}
			</div>
		</div>

		<!-- System Branding -->
		<div class="flex w-full max-w-7xl flex-col gap-3 rounded-3xl bg-white p-5 text-xl">
			<h2 class="text-lg font-bold text-gray-700">System Branding</h2>
			<div class="flex flex-col gap-3 md:flex-row">
				<div class="flex w-full flex-col gap-y-2 rounded-xl border-4 border-gray-300 p-3">
					<label for="region-name" class="text-sm font-medium">Agency Name</label>
					<input
						id="region-name"
						type="text"
						bind:value={localConfig.branding.regionName}
						placeholder={data.regionName}
						class="rounded border border-gray-300 px-3 py-2 text-base"
					/>
				</div>
				<div class="flex w-full flex-col gap-y-2 rounded-xl border-4 border-gray-300 p-3">
					<label for="logo-url" class="text-sm font-medium">Logo URL</label>
					<input
						id="logo-url"
						type="url"
						bind:value={localConfig.branding.logoUrl}
						placeholder={data.logoUrl}
						class="rounded border border-gray-300 px-3 py-2 text-base"
					/>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each Object.entries(SITE_TOKENS) as [key, token] (key)}
					{@render colorPicker(key, token)}
				{/each}
			</div>
		</div>

		{#if saveErrors.length}
			<ul class="w-full max-w-7xl rounded-3xl bg-white px-6 py-3 text-sm text-red-500" role="alert">
				{#each saveErrors as error (error)}
					<li>{error}</li>
				{/each}
			</ul>
		{/if}

		<div
			class="flex w-full max-w-7xl justify-around gap-x-10 rounded-3xl bg-white px-6 py-3 text-xl"
		>
			<button
				type="button"
				class="text-brand-red hover:bg-brand-red/10 rounded-4xl px-5 py-1"
				onclick={resetChanges}
			>
				Set to default
			</button>
			<button
				type="button"
				class="text-oba-green hover:bg-oba-green/10 rounded-4xl px-5 py-1 font-bold"
				onclick={saveChanges}
			>
				Save changes
			</button>
		</div>
	</div>
</div>
