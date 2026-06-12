import oba from '$lib/obaSdk';
import { error } from '@sveltejs/kit';

const cache = new Map();

export async function GET({ params }) {
	const stopID = params.id;

	try {
		const response = await oba.arrivalAndDeparture.list(stopID);

		// Upstream returns `null` (HTTP 200) for some valid stops with no real-time
		// data. Only cache responses with real data so we never serve null as stale.
		if (response?.data?.entry?.arrivalsAndDepartures) {
			cache.set(stopID, response);
		}

		return new Response(JSON.stringify(response), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.warn(`OBA fetch failed for stop ${stopID}:, ${err.message}`);

		if (cache.has(stopID)) {
			return new Response(
				JSON.stringify({
					...cache.get(stopID),
					stale: true
				}),
				{ headers: { 'Content-Type': 'application/json' } }
			);
		}

		throw error(503, `No data available for stop ${stopID}`);
	}
}
