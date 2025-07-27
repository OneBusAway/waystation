<script>
	import { formatDate, formatDateTime } from '$lib/formatters.js';
	import { onMount, onDestroy } from 'svelte';

	let interval;

	let defaultTitle = 'Transit Board';
	let defaultIcon = 'https://onebusaway.org/wp-content/uploads/oba_logo-1.png';

	let { imageUrl = defaultIcon, title = defaultTitle } = $props();

	if (typeof imageUrl !== 'string') imageUrl = defaultIcon;

	let now = $state(new Date());

	onMount(() => {
		interval = setInterval(() => {
			now = new Date();
		}, 1000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="flex justify-between gap-x-[0.833vw] p-[0.416vw] whitespace-nowrap">
	<div class="flex w-full justify-between gap-[0.833vw] px-[0.416vw] py-[0.416vw]">
		<div class="flex items-center justify-center gap-x-[0.416vw]">
			<a href="/" class="block">
				<img src={imageUrl} alt="Homepage" class="h-[1.875vw] rounded-[0.329vw]" />
			</a>
			<a href="/" class="block text-[1.04vw] leading-none font-extrabold">
				{title}
			</a>
		</div>
	</div>
	<div class="flex flex-col gap-y-[0.416vw] text-right leading-none">
		<div class="text-[1.25vw]">{formatDate(now)}</div>
		<div class="text-[1.875vw] font-bold">{formatDateTime(now)}</div>
	</div>
</div>
