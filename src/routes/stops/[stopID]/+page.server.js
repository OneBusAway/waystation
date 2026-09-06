import { parseScreenParams } from '$lib/formatters.js';

// The multi-stop grid is designed for up to six cards (see multi-stop-board.svelte).
const MAX_STOPS = 6;

export function load({ params, url }) {
	// Dedupe and drop empty segments so keyed cards never collide and no fetch targets ''.
	const stopIDs = [
		...new Set(
			params.stopID
				.split('+')
				.map((s) => s.trim())
				.filter(Boolean)
		)
	].slice(0, MAX_STOPS);

	// Multi-screen pagination only applies to a single stop: `screen`/`screens`
	// split one stop's departures across displays. Invalid/missing params default
	// to a single screen, which renders identically to today's behavior.
	const { screen, screens } = parseScreenParams(url.searchParams);

	// `config`, `logoUrl`, and `regionName` arrive merged in from the root layout load.
	return { stopIDs, screen, screens };
}
