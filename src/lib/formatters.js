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

// Get status for arrival or departure
export function formatArrivalStatus(predictedTime, scheduledTime) {
	const now = new Date();
	const predicted = new Date(predictedTime);

	const predictedDiff = Math.floor((predicted - now) / 60000);

	if (predictedTime === 0) {
		return {
			status: 'Scheduled',
			text: '',
			color: 'text-gray-500',
			minutes: null,
			displayTime: formatTime2(scheduledTime)
		};
	} else if (predictedDiff < -2) {
		// If the bus left more than 2 minutes ago, it's already gone
		return null;
	} else if (predictedDiff <= 0) {
		// If it's within 2 minutes of departure, show "Departing now" with time
		return {
			status: 'Departing',
			text: 'Departing now',
			color: 'text-red-500',
			minutes: null,
			displayTime: formatTime2(predictedTime)
		};
	} else if (predictedDiff <= 20) {
		return {
			status: 'Arriving',
			text: 'Arriving in',
			color: 'text-blue-500',
			minutes: predictedDiff,
			displayTime: formatTime2(predictedTime)
		};
	} else {
		return {
			status: 'Scheduled',
			text: '',
			color: 'text-gray-500',
			minutes: null,
			displayTime: formatTime2(scheduledTime)
		};
	}
}

// Check if the vehicle is departing late or on time
export function formatRouteStatus(predictedTime, scheduledTime) {
	if (typeof predictedTime === 'undefined' || predictedTime === null || predictedTime === 0) {
		return {
			status: 'UNKNOWN',
			color: 'text-gray-500'
		};
	}
	const predicted = new Date(predictedTime);
	const scheduled = new Date(scheduledTime);
	const diff = Math.floor((predicted - scheduled) / 60000);

	if (diff < -1) {
		return {
			status: 'EARLY',
			color: 'bg-green-500'
		};
	} else if (diff > 1) {
		return {
			status: 'LATE',
			color: 'bg-red-500'
		};
	} else {
		return {
			status: 'ON TIME',
			color: 'bg-blue-500'
		};
	}
}

/**
 * Format time for display
 * @param {Date} time
 */
export function formatTime2(time) {
	const date = new Date(time);
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
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

/**
 * Format the current time for display
 * @param {Date} date
 */
export function formatCurrentTime(date) {
	return date.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: true
	});
}

/**
 * Generate a unique ID string based on trip and stop IDs.
 * Used to uniquely identify departure blocks.
 *
 * @param {string} tripID - The trip ID
 * @param {string} stopID - The stop ID
 * @returns {string} - A unique ID in the format "tripID-stopID-randomNumber"
 */
export function generateRandomID(tripID, stopID) {
	return `${tripID ?? '0'}-${stopID ?? '0'}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Sort a list of departures by their earliest available departure time.
 * Filters out departures with invalid or missing times.
 *
 * @param {Array} departures - Array of departure objects with predicted or scheduled times
 * @returns {Array} - Sorted array of valid departures in chronological order
 */
export function sortEarliestDepartures(departures) {
	const validDepartures = departures.filter((dep) => {
		const time = dep.predictedDepartureTime ?? dep.scheduledDepartureTime;

		return time && time > 0;
	});

	const sortedDepartures = validDepartures.sort((x, y) => {
		const timeX = x.predictedDepartureTime ?? x.scheduledDepartureTime;
		const timeY = y.predictedDepartureTime ?? y.scheduledDepartureTime;

		return timeX - timeY;
	});

	return sortedDepartures;
}
