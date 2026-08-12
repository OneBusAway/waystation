import { getConfig } from '$lib/config/config.js';

export function load() {
	try {
		const config = getConfig();
		return { theme: config.theme };
	} catch {
		return { theme: {} };
	}
}
