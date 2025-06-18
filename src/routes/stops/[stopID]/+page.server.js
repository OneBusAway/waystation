import oba, { handleOBAResponse } from '$lib/obaSdk.js';

export async function load({ params }) {
	const stopIDs = params.stopID.split('+');

	const stopResponses = await Promise.all(stopIDs.map((eachID) => oba.stop.retrieve(eachID)));
	const stopBodies = await Promise.all(
		stopResponses.map((eachResponse) => handleOBAResponse(eachResponse, 'stop').json())
	);

	return {
		stopIDs,
		dataBlocks: stopBodies.map((stopData) => stopData.data)
	};
}
