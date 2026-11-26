import fs from 'fs';
import { normalizeConfig } from './defaults.js';

const DEFAULT_PATH = 'src/lib/config/settings.json';

function configPath() {
	return process.env.WAYSTATION_CONFIG_PATH || DEFAULT_PATH;
}

/** Read settings.json, falling back to defaults when it is missing, unreadable, or malformed. */
export function getConfig() {
	const filePath = configPath();
	if (!fs.existsSync(filePath)) return normalizeConfig();
	try {
		return normalizeConfig(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
	} catch (err) {
		console.error('[waystation] Failed to load config, using defaults:', err);
		return normalizeConfig();
	}
}

export function saveConfig(file) {
	fs.writeFileSync(configPath(), JSON.stringify(normalizeConfig(file), null, 2));
}

export const startTime = Date.now();
