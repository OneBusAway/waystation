import { BRANDING_DEFAULTS, asObject, normalizeBranding } from './branding.js';

export const THEMES = ['system', 'light', 'dark'];
export const COLOR_MODES = ['color', 'mono'];

export const DEFAULT_CONFIG = {
	maxDepartures: 4,
	updateInterval: 30,
	theme: THEMES[0],
	colorMode: COLOR_MODES[0],
	branding: BRANDING_DEFAULTS,
	showCrowding: false
};

function positiveInt(value, fallback) {
	const n = Math.floor(Number(value));
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Coerce a possibly hand-edited or malformed config into a fully valid one. Never throws. */
export function normalizeConfig(raw) {
	const source = asObject(raw);
	return {
		...source,
		maxDepartures: positiveInt(source.maxDepartures, DEFAULT_CONFIG.maxDepartures),
		updateInterval: positiveInt(source.updateInterval, DEFAULT_CONFIG.updateInterval),
		theme: THEMES.includes(source.theme) ? source.theme : DEFAULT_CONFIG.theme,
		colorMode: COLOR_MODES.includes(source.colorMode) ? source.colorMode : DEFAULT_CONFIG.colorMode,
		branding: normalizeBranding(source.branding),
		showCrowding:
			typeof source.showCrowding === 'boolean' ? source.showCrowding : DEFAULT_CONFIG.showCrowding
	};
}
