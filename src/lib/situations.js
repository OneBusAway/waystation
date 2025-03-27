import { writable } from 'svelte/store';

export const situationsStore = writable([]);

export async function fetchSituations(stopID) {
	try {
		const response = await fetch(`/api/oba/arrivals-and-departures-for-stop/${stopID}`);
		if (!response.ok) throw new Error('Failed to fetch maintenance situations');
		const responseBody = await response.json();
		situationsStore.set(responseBody.data.references?.situations || []);
	} catch (error) {
		console.error('Error fetching maintenance situations:', error);
		situationsStore.set([]);
	}
}
