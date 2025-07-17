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

<div class="flex gap-x-4 p-2">
	<div class="flex w-full justify-between gap-4 px-2 py-2 md:w-auto">
		<div class="flex items-center justify-center gap-x-2">
			<a href="/" class="block">
				<img src={imageUrl} alt="Homepage" class="h-10 rounded-sm" />
			</a>
			<a href="/" class="block text-xl font-extrabold">
				{title}
			</a>
		</div>
	</div>
	<div class="flex-1 text-right">
		<div class="text-2xl">{formatDate(now)}</div>
		<div class="text-4xl font-bold">{formatDateTime(now)}</div>
	</div>
</div>
