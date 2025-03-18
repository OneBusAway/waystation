import oba from '$lib/obaSdk.js';
import { stopIDs } from '$lib/dataStore';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const stopIDList = stopIDs();
	const requestPromises = stopIDList.map((id) => oba.stop.retrieve(id));
	const responses = await Promise.all(requestPromises);

	const stopsInfo = responses.map((response) => ({
		name: response.data.entry.name,
		code: response.data.entry.code
	}));

	return json(stopsInfo);
}
