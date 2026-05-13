import oba, { handleOBAResponse } from '$lib/obaSdk.js';

export async function load({ url }) {
	const agencies = await oba.agenciesWithCoverage.list();
	const agenciesBody = await handleOBAResponse(agencies, 'agencies').json();
	const agencyRefs = agenciesBody.data.references.agencies;

	const selectedAgencyId = url.searchParams.get('agency');
	let stopIDs = [];

	if (selectedAgencyId) {
		try {
			const response = await oba.stopIdsForAgency.list(selectedAgencyId);
			const json = await handleOBAResponse(response, 'stop-ids').json();
			stopIDs = json.data.list;
		} catch {
			stopIDs = [];
		}
	}

	return {
		agencies: agencyRefs.sort((a, b) => a.name.localeCompare(b.name)),
		selectedAgencyId,
		stopIDs
	};
}
