<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';

	let icon = PUBLIC_OBA_LOGO_URL ?? 'https://onebusaway.org/wp-content/uploads/oba_logo-1.png';
	let name = PUBLIC_OBA_REGION_NAME ?? 'Waystation';
</script>

<div
	class="text-brand-darkerblue flex h-screen flex-col items-center justify-center gap-y-10 whitespace-nowrap"
>
	<div class="flex items-center gap-x-5 text-6xl font-bold">
		<img src={icon} alt="Homepage" class="aspect-square w-16 rounded-sm" />
		<span>{name}</span>
	</div>
	<div class="text-brand-red text-9xl font-black">Out of Service!</div>
	<span class="text-3xl font-semibold">We will be back shortly...</span>
</div>
