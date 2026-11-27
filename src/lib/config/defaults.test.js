import { describe, expect, it } from 'vitest';
import {
	COLOR_MODES,
	DEFAULT_CONFIG,
	NIGHT_MODE_STYLES,
	THEMES,
	TIME_FORMATS,
	normalizeConfig
} from './defaults.js';

describe('normalizeConfig', () => {
	it('returns defaults for an empty or missing config', () => {
		expect(normalizeConfig()).toEqual(DEFAULT_CONFIG);
		expect(normalizeConfig({})).toEqual(DEFAULT_CONFIG);
	});

	it('returns defaults for non-object values such as a null settings file', () => {
		expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG);
		expect(normalizeConfig('dark')).toEqual(DEFAULT_CONFIG);
		expect(normalizeConfig([1, 2])).toEqual(DEFAULT_CONFIG);
	});

	it('keeps valid values', () => {
		const cfg = {
			maxDepartures: 6,
			updateInterval: 15,
			theme: 'light',
			colorMode: 'mono',
			timeFormat: '24H',
			showCrowding: true,
			nightModeStart: '22:00',
			nightModeEnd: '06:00',
			nightModeStyle: 'minimal'
		};
		expect(normalizeConfig(cfg)).toEqual({ ...cfg, branding: DEFAULT_CONFIG.branding });
	});

	it('normalizes branding without throwing on bad values', () => {
		const out = normalizeConfig({ branding: { boardBg: '#101010', brandRed: 'red' } });
		expect(out.branding.boardBg).toBe('#101010');
		expect(out.branding.brandRed).toBe('');
	});

	it('falls back on invalid theme, colorMode, timeFormat, showCrowding, and numbers', () => {
		expect(
			normalizeConfig({
				maxDepartures: 'abc',
				updateInterval: -2,
				theme: 'neon',
				colorMode: 'x',
				timeFormat: '12h',
				showCrowding: 'yes'
			})
		).toEqual(DEFAULT_CONFIG);
	});

	it('exposes defaults that are members of the option lists', () => {
		expect(THEMES).toContain(DEFAULT_CONFIG.theme);
		expect(COLOR_MODES).toContain(DEFAULT_CONFIG.colorMode);
		expect(TIME_FORMATS).toContain(DEFAULT_CONFIG.timeFormat);
		expect(DEFAULT_CONFIG.timeFormat).toBe('AUTO');
	});

	it('disables night mode on invalid times and falls back on invalid style', () => {
		const out = normalizeConfig({
			nightModeStart: '25:00',
			nightModeEnd: 'abc',
			nightModeStyle: 'sparkly'
		});
		expect(out.nightModeStart).toBe('');
		expect(out.nightModeEnd).toBe('');
		expect(out.nightModeStyle).toBe('dim');
		expect(NIGHT_MODE_STYLES).toContain(DEFAULT_CONFIG.nightModeStyle);
	});
});
