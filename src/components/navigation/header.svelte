<script>
	import { formatDate, formatDateTime } from '$lib/formatters.js';

	let defaultTitle = 'Transit Board';
	let defaultIcon = 'https://onebusaway.org/wp-content/uploads/oba_logo-1.png';

	let { imageUrl = defaultIcon, title = defaultTitle } = $props();

	let now = $state(new Date());

	setInterval(() => {
		now = new Date();
	}, 1000);
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
		<div class="text-sm">{formatDate(now)}</div>
		<div class="text-3xl font-bold">{formatDateTime(now)}</div>
	</div>
</div>
