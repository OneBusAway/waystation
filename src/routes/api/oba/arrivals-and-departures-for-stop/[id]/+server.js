import oba from '$lib/obaSdk';
import { error } from '@sveltejs/kit';

const cache = new Map();

export async function GET({ params }) {
	const stopID = params.id;

	try {
		const response = await oba.arrivalAndDeparture.list(stopID);

		cache.set(stopID, response);

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
