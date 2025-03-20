/**
 * Format time for display
 * @param {Date} date
 */
export function formatTime(date) {
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit', // Add this line to show seconds
		hour12: true
	});
}

/**
 * Format date for display
 * @param {Date} date
 */
export function formatDate(date) {
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});
}
