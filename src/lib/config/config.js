import fs from 'fs';
import { THEME_DEFAULTS, SITE_TOKENS, BOARD_TOKENS } from './theme.js';

const PATH = 'src/lib/config/settings.json';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function validateTheme(theme = {}) {
	const colorTokens = { ...SITE_TOKENS, ...BOARD_TOKENS };

	for (const key of Object.keys(colorTokens)) {
		const value = theme[key];

		if (value && !HEX_COLOR.test(value)) {
			throw new Error(`Invalid color value for theme token: ${key}`);
		}
	}

	return theme;
}

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

	config.theme = {
		...THEME_DEFAULTS,
		...config.theme
	};

	return config;
}

export function saveConfig(file) {
	validateTheme(file.theme);

	const writeData = JSON.stringify(file, null, '\t');
	fs.writeFileSync(PATH, writeData);
}

export const startTime = Date.now();
