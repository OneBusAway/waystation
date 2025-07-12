<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';
	import { setLocale } from '$lib/paraglide/runtime';

	import Header from '$components/navigation/header.svelte';

	let selector = $state('en');

	function saveChanges() {
		setLocale(selector);
	}
</script>

<div class="flex min-h-screen flex-col">
	<Header title={PUBLIC_OBA_REGION_NAME} imageUrl={PUBLIC_OBA_LOGO_URL} />

	<div class="text-brand-darkerblue flex flex-1 flex-col items-center justify-center text-3xl">
		<div class="border-brand-lightgray flex flex-col gap-y-8 rounded-[32px] border-3 p-12">
			<div class="text-brand-darkblue font-bold">Display Language</div>
			<div class="flex justify-center">
				<form>
					<input type="radio" id="en" name="language" bind:group={selector} value="en" />
					<label for="en">English (en)</label>
					<br />
					<input type="radio" id="ar" name="language" bind:group={selector} value="ar" />
					<label for="ar">Arabic (ar)</label>
					<br />
					<input type="radio" id="fr" name="language" bind:group={selector} value="fr" />
					<label for="fr">French (fr)</label>
					<br />
					<input type="radio" id="es" name="language" bind:group={selector} value="es" />
					<label for="es">Spanish (es)</label>
					<br />
					<input type="radio" id="de" name="language" bind:group={selector} value="de" />
					<label for="de">German (de)</label>
				</form>
			</div>
			<div class="flex justify-end text-xl text-black">
				<button
					onclick={saveChanges}
					class="bg-oba-green cursor-pointer rounded-[16px] p-2 px-4 font-semibold"
				>
					Save changes
				</button>
			</div>
		</div>
	</div>
</div>
