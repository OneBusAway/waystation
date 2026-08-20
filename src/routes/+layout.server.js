import { getConfig } from '$lib/config/config.js';

export function load() {
	try {
		const config = getConfig();
		return { theme: config.theme };
	} catch (err) {
		console.error('[waystation] Failed to load theme config:', err);
		return { theme: {} };
	}
}
