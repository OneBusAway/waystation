import oba from '$lib/obaSdk.js';
import { stopIDs } from '$lib/dataStore';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const stopIDList = stopIDs();
	const requestPromises = stopIDList.map((id) => oba.arrivalAndDeparture.list(id));
	const responses = await Promise.all(requestPromises);
	const data = responses.flatMap((r) => r.data.entry.arrivalsAndDepartures);
	return json(data);
}
