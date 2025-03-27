<script>
	import { formatDate, formatTime } from '$lib/formatters.js';

	let { currentDate, imageUrl, title } = $props();
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
		<div class="text-sm">{formatDate(currentDate)}</div>
		<div class="text-3xl font-bold">{formatTime(currentDate)}</div>
	</div>
</div>
