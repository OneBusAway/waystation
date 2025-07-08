import * as t from '$lib/paraglide/messages.js';
import { languageTag } from './paraglide/runtime';

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

/**
 * Determines real-time arrival/departure status and timing
 *
 * @param {number} predictedTime - Predicted arrival timestamp (0 if unavailable)
 * @param {number} scheduledTime - Scheduled arrival timestamp
 *
 * @returns {Object|null} Returns {status, eta, scheduledTime} or null if departed
 */
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

export function formatTranslation() {}

/**
 * Calculate early/late status compared to schedule
 *
 * @param {number} predictedTime - Predicted timestamp
 * @param {number} scheduledTime - Scheduled timestamp
 *
 * @returns {Object} {status: string|null, tag: string|null}
 */
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
			tag: `${t.departure_statusEarly({ num: Math.abs(diff) })}`
		};
	}

	if (diff > 1) {
		return {
			status: 'late',
			tag: `${t.departure_statusLate({ num: Math.abs(diff) })}`
		};
	}

	return {
		status: 'on-time',
		tag: null
	};
}

/**
 * Get border color class based on status
 *
 * @param {string} defaultStatus - Arrival status
 * @param {string} routeStatus - Early/late status
 *
 * @returns {Object} {borderColor: string}
 */
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

/**
 * Get shadow color variable based on status
 *
 * @param {string} defaultStatus - Arrival status
 * @param {string} routeStatus - Early/late status
 *
 * @returns {Object} {shadowColor: string}
 */
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

/**
 * Get text color class based on status
 *
 * @param {string} defaultStatus - Arrival status
 * @param {string} routeStatus - Early/late status
 *
 * @returns {Object} {textColor: string}
 */
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
	return date.toLocaleDateString(`${languageTag()}`, {
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
	return new Date(timestamp).toLocaleString(`${languageTag()}`, {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Remove duplicate departures based on tripId and scheduledDepartureTime
 *
 * @param {Array} departures - Array of departure objects
 * @returns {Array} - Deduplicated departures
 */
export function removeDuplicates(departures) {
	const seen = new Set();

	return departures.filter((dep) => {
		const key = `${dep.tripId}_${dep.scheduledDepartureTime}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

/**
 * Translates a given text into the specified target language by proxying
 * through Google’s unofficial translate endpoint.
 *
 * @param {string} text        - The text to translate.
 * @param {string} targetLang  - The BCP-47 language code to translate into (e.g. 'es', 'ar', 'fr').
 * @returns {Promise<string>}  - A promise that resolves to the translated string.
 * @throws {Error}             - If the fetch request fails or returns a non-OK status.
 */
export async function translate(text, targetLang) {
	const params = new URLSearchParams({
		client: 'gtx',
		sl: 'auto',
		tl: targetLang,
		dt: 't',
		q: text
	});

	const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);

	if (!res.ok) {
		throw new Error('Google-translate proxy failed');
	}

	const body = await res.json();
	return body[0].map((chunk) => chunk[0]).join('');
}
