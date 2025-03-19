<script>
	import { PUBLIC_OBA_LOGO_URL, PUBLIC_OBA_REGION_NAME } from '$env/static/public';

	const { currentDate, currentTime } = $props();
	// Format time for display
	function formatTime(date) {
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit', // Add this line to show seconds
			hour12: true
		});
	}

	// Format date for display
	function formatDate(date) {
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="flex gap-x-4 p-2">
	<div class="flex w-full justify-between gap-4 px-2 py-2 md:w-auto">
		<div class="flex items-center justify-center gap-x-2">
			<a href="/" class="block">
				<img src={PUBLIC_OBA_LOGO_URL} alt="Homepage" class="h-10 rounded-sm" />
			</a>
			<a href="/" class="block text-xl font-extrabold">
				{PUBLIC_OBA_REGION_NAME}
			</a>
		</div>
	</div>
	<div class="flex-1 text-right">
		<div class="text-sm">{formatDate(currentDate)}</div>
		<div class="text-3xl font-bold">{formatTime(currentTime)}</div>
	</div>
</div>
