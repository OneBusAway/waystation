import * as t from '$lib/paraglide/messages.js';
import { getLocale } from './paraglide/runtime';
import { Duration } from 'luxon';

/**
 * Format seconds into a human-readable time
 * @param {number} seconds
 * @returns {string}
 */
export function formatSeconds(seconds) {
	return Duration.fromObject({ seconds })
		.shiftTo('months', 'days', 'hours', 'minutes', 'seconds')
		.toHuman({ listStyle: 'long', unitDisplay: 'long' });
}

/**
 * Format time for display
 * @param {Date} date
 */
export function formatDateTime(date) {
	return date.toLocaleTimeString(getLocale(), {
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
	return date.toLocaleTimeString(getLocale(), {
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
	return date.toLocaleDateString(`${getLocale()}`, {
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
	return date.toLocaleTimeString(getLocale(), {
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
	// OBA returns predictedDepartureTime: 0 when no real-time prediction exists, so we use
	// `||` (not `??`) to fall through to scheduledDepartureTime for scheduled-only departures.
	const validDepartures = departures.filter((dep) => {
		const time = dep.predictedDepartureTime || dep.scheduledDepartureTime;

		return time && time > 0;
	});

	const sortedDepartures = validDepartures.sort((x, y) => {
		const timeX = x.predictedDepartureTime || x.scheduledDepartureTime;
		const timeY = y.predictedDepartureTime || y.scheduledDepartureTime;

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
	return new Date(timestamp).toLocaleString(`${getLocale()}`, {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

// A trailing bay belongs in the card's meta line next to the stop code and direction, not in
// the title. Both separators the feeds use are matched; a bare hyphenated place name
// ("Bellevue - Downtown") must not be treated as a bay, hence the explicit "bay" keyword.
const BAY_SUFFIX = /\s*[-–—]\s*(bay\s+[\w-]+)\s*$/i;
const BAY_PARENTHESISED = /\s*\((bay\s+[\w-]+)\)\s*$/i;

/**
 * Split a trailing bay designator off a stop name.
 *
 * @param {string} name - Raw stop name from the feed
 * @returns {{name: string, bay: string}} - Title text and bay label ('' when there is no bay)
 */
export function splitStopName(name) {
	const raw = typeof name === 'string' ? name.trim() : '';

	for (const pattern of [BAY_SUFFIX, BAY_PARENTHESISED]) {
		const match = raw.match(pattern);
		if (match) {
			// Normalise the keyword's casing but leave the identifier alone, so "BAY D-3" becomes
			// "Bay D-3" rather than "Bay d-3".
			const bay = match[1].replace(/\s+/g, ' ').replace(/^bay/i, 'Bay');
			return { name: raw.slice(0, match.index).trim(), bay };
		}
	}

	return { name: raw, bay: '' };
}

/**
 * Format an alert's active-window boundary for the board's right rail. The board already
 * states today's date in the header, so the weekday and year are noise here.
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - A short date like "Aug 18"
 */
export function formatAlertWindow(timestamp) {
	return new Date(timestamp).toLocaleDateString(`${getLocale()}`, {
		month: 'short',
		day: 'numeric'
	});
}

// OBA reports severity with the GTFS-RT vocabulary, which has seven values; the board paints
// three tones. Without this mapping the severity class matched no CSS rule, so --alert-tone
// was never set and the 6px severity bar and background tint silently did not render.
const SEVERITY_TONES = {
	noimpact: 'info',
	veryslight: 'info',
	slight: 'info',
	normal: 'advisory',
	severe: 'alert',
	verysevere: 'alert',
	// A feed that already speaks the board's own vocabulary passes straight through.
	info: 'info',
	advisory: 'advisory',
	alert: 'alert'
};

/**
 * Map an OBA situation severity onto one of the board's three alert tones.
 *
 * @param {string} severity - Raw severity string from OBA
 * @returns {'info'|'advisory'|'alert'} - Always a tone the stylesheet defines
 */
export function alertTone(severity) {
	const key = String(severity ?? '')
		.toLowerCase()
		.replace(/[\s_-]/g, '');
	return SEVERITY_TONES[key] ?? 'advisory';
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
 * Map an OBA arrival/departure into the Board UI's row model.
 *
 * @param {Object} dep - OBA arrivalAndDeparture record (with stopName already attached)
 * @param {Date} [now=new Date()]
 * @returns {{route: string, name: string, dest: string, min: number, delta: number|null, status: 'ONTIME'|'EARLY'|'LATE'|'SCHED'|'CANCEL', stopName: string, departureAt: number, tripId: string|undefined, occupancy: 'LIGHT'|'MEDIUM'|'FULL'|null}}
 */
export function formatBoardDeparture(dep, now = new Date()) {
	const predicted = dep.predictedDepartureTime;
	const scheduled = dep.scheduledDepartureTime;
	const departureAt = predicted && predicted > 0 ? predicted : scheduled;
	const hasValidTime = Number.isFinite(departureAt) && departureAt > 0;
	const min = hasValidTime ? Math.floor((departureAt - now.getTime()) / 60000) : -Infinity;

	let delta = null;
	let status = 'SCHED';
	if (dep.tripStatus?.status === 'CANCELED') {
		status = 'CANCEL';
	} else if (predicted && predicted > 0) {
		delta = Math.round((predicted - scheduled) / 60000);
		if (delta <= -1) status = 'EARLY';
		else if (delta >= 1) status = 'LATE';
		else status = 'ONTIME';
	}

	return {
		route: dep.routeShortName || '?',
		name: dep.routeLongName || dep.tripHeadsign || '',
		dest: dep.tripHeadsign || '',
		min,
		delta,
		status,
		stopName: dep.stopName ?? '',
		departureAt,
		tripId: dep.tripId,
		occupancy: formatOccupancy(dep.occupancyStatus)
	};
}

/**
 * Merge an incoming arrivals list against the current one, preserving object
 * references for rows whose rendered fields haven't changed. Lets Svelte skip
 * re-running per-row derived computations for rows that are unchanged.
 *
 * @param {Array} prev - Current arrivals array held in $state
 * @param {Array} next - Freshly formatted arrivals from the latest fetch
 * @returns {Array} - next, with unchanged rows replaced by their prev reference
 */
export function diffArrivals(prev, next) {
	const prevMap = new Map(prev.map((a) => [a.tripId, a]));

	return next.map((n) => {
		const p = prevMap.get(n.tripId);
		if (!p) return n;

		const unchanged =
			p.route === n.route &&
			p.name === n.name &&
			p.dest === n.dest &&
			p.min === n.min &&
			p.status === n.status &&
			p.delta === n.delta &&
			p.stopName === n.stopName &&
			p.departureAt === n.departureAt &&
			p.occupancy === n.occupancy;
		return unchanged ? p : n;
	});
}

/**
 * Normalize an OBA arrivals-and-departures-for-stop response into the board's
 * per-stop result model.
 *
 * Upstream OBA returns the literal body `null` (HTTP 200) for some valid stops
 * that have no available real-time data (e.g. MTS_75057). A response without a
 * departures array is treated as an empty result rather than an error, so the
 * board renders an empty state instead of failing.
 *
 * @param {Object|null} json - Parsed proxy response (may be null)
 * @param {string} id - Stop ID (e.g. "MTS_75057")
 * @returns {{stopId: string, stopCode: string, stopName: string, direction: string, stale: boolean, departures: Array, situations: Array}}
 */
export function parseStopDepartures(json, id) {
	const stopsRef = json?.data?.references?.stops;
	const stopRecord = stopsRef ? Object.values(stopsRef).find((s) => s.id === id) : null;
	const stopCode = stopRecord?.code || id.split('_')[1] || id;
	const stopName = stopRecord?.name ?? t.board_stop_label({ stopId: stopCode });

	const departures = json?.data?.entry?.arrivalsAndDepartures;

	return {
		stopId: id,
		stopCode,
		stopName,
		direction: stopRecord?.direction ?? '',
		stale: json?.stale === true,
		departures: Array.isArray(departures) ? departures.map((dep) => ({ ...dep, stopName })) : [],
		situations: json?.data?.references?.situations ?? []
	};
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
const translationCache = new Map();

export function translate(text, targetLang) {
	const key = `${targetLang} ${text}`;
	let pending = translationCache.get(key);
	if (!pending) {
		pending = fetchTranslation(text, targetLang).catch((err) => {
			translationCache.delete(key);
			throw err;
		});
		translationCache.set(key, pending);
	}
	return pending;
}

async function fetchTranslation(text, targetLang) {
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

const OCCUPANCY_LEVELS = {
	EMPTY: 'LIGHT',
	MANY_SEATS_AVAILABLE: 'LIGHT',
	FEW_SEATS_AVAILABLE: 'MEDIUM',
	STANDING_ROOM_ONLY: 'MEDIUM',
	CRUSHED_STANDING_ROOM_ONLY: 'FULL',
	FULL: 'FULL',
	NOT_ACCEPTING_PASSENGERS: 'FULL'
};

/**
 * Bucket an OBA occupancy status for the departure row's crowding indicator.
 *
 * @param {string|null|undefined} occupancyStatus - Raw status from OBA
 * @returns {'light'|'medium'|'full'|null} - null when there is no usable data, so nothing renders
 */
export function formatOccupancy(occupancyStatus) {
	return Object.hasOwn(OCCUPANCY_LEVELS, occupancyStatus)
		? OCCUPANCY_LEVELS[occupancyStatus]
		: null;
}
