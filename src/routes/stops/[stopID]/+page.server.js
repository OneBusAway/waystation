export async function load({ params }) {
	const stopIDs = params.stopID.split('+');

	return {
		stopIDs
	};
}
