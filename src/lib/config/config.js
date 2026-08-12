import fs from 'fs';
import { THEME_DEFAULTS } from './theme.js';

const PATH = 'src/lib/config/settings.json';

export function getConfig() {
	if (!fs.existsSync(PATH)) {
		return {
			maxDepartures: 4,
			updateInterval: 30,
			theme: { ...THEME_DEFAULTS }
		};
	}
	const fileData = fs.readFileSync(PATH, 'utf-8');
	const config = JSON.parse(fileData);
	config.theme = { ...THEME_DEFAULTS, ...config.theme };
	return config;
}

export function saveConfig(file) {
	const writeData = JSON.stringify(file, null, '\t');
	fs.writeFileSync(PATH, writeData);
}

export const startTime = Date.now();
