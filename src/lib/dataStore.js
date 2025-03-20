import { PRIVATE_DEPARTURES } from '$env/static/private';

let departuresListCache = null;
let departuresMapCache = null;

/**
 * Returns all routes for the given stop ID
 * @param {string} stopID
 * @returns Array of route IDs
 */
export function routesForStopID(stopID) {
	const map = departuresMap();
	return map[stopID].routes;
}

/**
 * Returns all stop IDs
 * @returns {string[]} Array of stop IDs
 */
export function stopIDs() {
	return departuresList().map((item) => item.stopID);
}

/**
 * returns the list of departures, a set of objects with keys "stopID" and "routeIDs"
 * @returns {Array} Array of departures
 */
function departuresList() {
	if (!departuresListCache) {
		departuresListCache = JSON.parse(PRIVATE_DEPARTURES);
	}
	return departuresListCache;
}

function departuresMap() {
	if (!departuresMapCache) {
		const list = departuresList();
		return list.reduce((map, item) => {
			map[item.id] = item;
			return map;
		}, {});
	}
	return departuresMapCache;
}
