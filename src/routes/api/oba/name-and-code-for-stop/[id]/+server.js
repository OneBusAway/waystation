import oba, { handleOBAResponse } from '$lib/obaSdk.js';
import { error } from '@sveltejs/kit';

const cache = new Map();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	const stopIDs = params.id.split('+');

	try {
		const stopResponses = await Promise.all(stopIDs.map((eachID) => oba.stop.retrieve(eachID)));

		const stopBodies = await Promise.all(
			stopResponses.map((eachResponse) => handleOBAResponse(eachResponse, 'stop').json())
		);

		const dataBlocks = stopBodies.map((stopBody) => stopBody.data.entry);

		stopIDs.forEach((id, i) => {
			cache.set(id, stopBodies[i]);
		});

		return new Response(JSON.stringify(dataBlocks), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.warn(`OBA fetch failed for stops [${stopIDs.join(', ')}]: ${err.message}`);

		if (stopIDs.every((id) => cache.has(id))) {
			const cachedBlocks = stopIDs.map((id) => cache.get(id).data.entry);

			return new Response(JSON.stringify(cachedBlocks.map((b) => ({ ...b, stale: true }))), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		throw error(503, `No data available for stops [${stopIDs.join(', ')}]`);
	}
}
