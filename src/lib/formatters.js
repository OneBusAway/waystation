/**
 * Format time for display
 * @param {Date} date
 */
export function formatDateTime(date) {
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit',
		hour12: true
	});
}

// Get status for arrival or departure
export function formatArrivalStatus(predictedTime, scheduledTime) {
	const now = new Date();

	const predicted = new Date(predictedTime);
	const scheduled = new Date(scheduledTime);

	const predictedDiff = Math.floor((predicted - now) / 60000);
	const scheduledDiff = Math.floor((scheduled - now) / 60000);

	// No predicted time, use scheduled time
	if (predictedTime === 0) {
		if (scheduledDiff < 10) {
			return {
				status: 'Arriving',
				eta: scheduledDiff,
				scheduledTime: formatTime(scheduledTime)
			};
		} else {
			return {
				status: 'Scheduled',
				eta: null,
				scheduledTime: formatTime(scheduledTime)
			};
		}
	}

	// Bus left more than 2 minutes ago
	if (predictedDiff < -2) {
		return null;
	}

	if (predictedDiff <= 0) {
		// Within 2 minutes
		return {
			status: 'Departing',
			eta: null,
			scheduledTime: formatTime(predictedTime)
		};
	} else if (predictedDiff < 10) {
		// Within 10 minutes
		return {
			status: 'Arriving',
			eta: predictedDiff,
			scheduledTime: formatTime(predictedTime)
		};
	} else {
		// More than 10 minutes away
		return {
			status: 'Scheduled',
			eta: null,
			scheduledTime: formatTime(predictedTime)
		};
	}
}

export function formatBorderColor(defaultStatus, routeStatus) {
	if (defaultStatus === 'Departing') {
		return {
			borderColor: 'border-brand-gray'
		};
	}

	if (routeStatus === 'early') {
		return {
			borderColor: 'border-brand-red'
		};
	}

	if (routeStatus === 'late') {
		return {
			borderColor: 'border-brand-blue'
		};
	}

	return {
		borderColor: 'border-brand-lightgray'
	};
}

export function formatShadowColor(defaultStatus, routeStatus) {
	if (defaultStatus === 'Departing') {
		return {
			shadowColor: 'var(--shadow-gray)'
		};
	}

	if (routeStatus === 'early') {
		return {
			shadowColor: 'var(--shadow-red)'
		};
	}

	if (routeStatus === 'late') {
		return {
			shadowColor: 'var(--shadow-blue)'
		};
	}

	return {
		shadowColor: 'var(--shadow-gray)'
	};
}

export function formatTextColor(defaultStatus, routeStatus) {
	if (defaultStatus === 'Departing') {
		return {
			textColor: ''
		};
	}

	if (routeStatus === 'early') {
		return {
			textColor: 'text-brand-red'
		};
	}

	if (routeStatus === 'late') {
		return {
			textColor: 'text-brand-blue'
		};
	}

	return {
		textColor: 'text-brand-gray'
	};
}

// Is the vehicle is early or late?
export function formatRouteStatus(predictedTime, scheduledTime) {
	if (typeof predictedTime === 'undefined' || predictedTime === null || predictedTime === 0) {
		return {
			status: null,
			tag: ''
		};
	}

	const predicted = new Date(predictedTime);
	const scheduled = new Date(scheduledTime);

	const diff = Math.floor((predicted - scheduled) / 60000);

	if (diff < -1) {
		return {
			status: 'early',
			tag: `${Math.abs(diff)} min early`
		};
	}

	if (diff > 1) {
		return {
			status: 'late',
			tag: `${diff} min late`
		};
	}

	return {
		status: 'on-time',
		tag: null
	};
}

/**
 * Format time for display
 * @param {Date} time
 */
export function formatTime(time) {
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

/**
 * Converts a Unix timestamp (in milliseconds) to a human-readable date and time string.
 *
 * @param {number} timestamp - The Unix timestamp in milliseconds (i.e. 1750530360000)
 * @returns {string} - A formatted date string like "Mon, Jul 21, 2025"
 */
export function formatTimestamp(timestamp) {
	return new Date(timestamp).toLocaleString('en-US', {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Validates if a string is in the expected formatted timestamp format.
 * Assumes the string was generated by `formatTimestamp()`
 *
 * @param {string} str - The formatted date string to validate
 * @returns {boolean} - True if valid date, false otherwise
 */
export function validateTimestamp(str) {
	const parsedDate = new Date(str);

	return !isNaN(parsedDate.getTime()) && typeof str === 'string' && str.trim().length > 0;
}
