import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const { baseLocale, locales } = readJson('project.inlang/settings.json');
const baseKeys = Object.keys(readJson(`messages/${baseLocale}.json`)).sort();

describe('translation key parity', () => {
	it.each(locales.filter((locale) => locale !== baseLocale))(
		'%s has the same keys as the base locale',
		(locale) => {
			const keys = Object.keys(readJson(`messages/${locale}.json`)).sort();
			expect(keys).toEqual(baseKeys);
		}
	);
});
