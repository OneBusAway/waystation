import oba, { handleOBAResponse } from '$lib/obaSdk.js';

export async function load({ url }) {
	const agencies = await oba.agenciesWithCoverage.list();
	const agenciesBody = await handleOBAResponse(agencies, 'agencies').json();
	const agencyRefs = agenciesBody.data.references.agencies;

	const selectedAgencyId = url.searchParams.get('agency');

	let stopIDs = [];
	let stops = [];

	if (selectedAgencyId) {
		stops = await stopsForAgency(selectedAgencyId);
		if (stops) {
			stopIDs = stops.map((s) => s.id);
		} else {
			stopIDs = await stopIdsForAgency(selectedAgencyId);
		}
	}

	return {
		agencies: agencyRefs.sort((a, b) => a.name.localeCompare(b.name)),
		selectedAgencyId,
		stopIDs,
		stops
	};
}

async function stopIdsForAgency(agencyID) {
	try {
		const response = await oba.stopIdsForAgency.list(agencyID);
		const json = await handleOBAResponse(response, 'stop-ids').json();
		return json.data.list;
	} catch {
		return [];
	}
}

async function stopsForAgency(agencyID) {
	let stops = null;
	try {
		const response = await oba.stopsForAgency.list(agencyID);
		const json = await handleOBAResponse(response, 'stops').json();
		stops = json.data.list;
	} catch (e) {
		console.error('stopsForAgency failed:', e);
		stops = null;
	}

	return stops;
}
