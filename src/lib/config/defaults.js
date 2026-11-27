import { BRANDING_DEFAULTS, asObject, normalizeBranding } from './branding.js';

export const THEMES = ['system', 'light', 'dark'];
export const COLOR_MODES = ['color', 'mono'];
// AUTO uses the board language's own default hour cycle.
export const TIME_FORMATS = ['AUTO', '12H', '24H'];
export const NIGHT_MODE_STYLES = ['dim', 'minimal'];

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Parse "HH:mm" into minutes since midnight, or null when missing/invalid. */
export function parseHHMM(value) {
	const m = typeof value === 'string' ? HHMM.exec(value) : null;
	return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export const DEFAULT_CONFIG = {
	maxDepartures: 4,
	updateInterval: 30,
	theme: THEMES[0],
	colorMode: COLOR_MODES[0],
	timeFormat: TIME_FORMATS[0],
	branding: BRANDING_DEFAULTS,
	showCrowding: false,
	nightModeStart: '',
	nightModeEnd: '',
	nightModeStyle: NIGHT_MODE_STYLES[0]
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
		timeFormat: TIME_FORMATS.includes(source.timeFormat)
			? source.timeFormat
			: DEFAULT_CONFIG.timeFormat,
		branding: normalizeBranding(source.branding),
		showCrowding:
			typeof source.showCrowding === 'boolean' ? source.showCrowding : DEFAULT_CONFIG.showCrowding,
		nightModeStart: parseHHMM(source.nightModeStart) !== null ? source.nightModeStart : '',
		nightModeEnd: parseHHMM(source.nightModeEnd) !== null ? source.nightModeEnd : '',
		nightModeStyle: NIGHT_MODE_STYLES.includes(source.nightModeStyle)
			? source.nightModeStyle
			: DEFAULT_CONFIG.nightModeStyle
	};
}
