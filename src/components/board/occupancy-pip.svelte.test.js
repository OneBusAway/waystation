import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import OccupancyPip from './occupancy-pip.svelte';

let mockLocale = 'en';

vi.mock('$lib/paraglide/runtime.js', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		getLocale: () => mockLocale
	};
});

beforeEach(() => {
	mockLocale = 'en';
});

describe('OccupancyPip', () => {
	afterEach(() => cleanup());

	test.each([
		['LIGHT', '●○○', 'Not Crowded'],
		['MEDIUM', '●●○', 'Crowded'],
		['FULL', '●●●', 'Full']
	])('renders %s as %s with its label', (level, glyphs, label) => {
		const { container } = render(OccupancyPip, { props: { level } });
		const pip = container.querySelector(`.occupancy-${level}`);
		expect(pip).not.toBeNull();
		expect(pip.querySelector('[aria-hidden="true"]').textContent.trim()).toBe(glyphs);
		expect(pip.textContent).toContain(label);
	});

	test.each([null, undefined, 'UNKNOWN'])('renders nothing for %s', (level) => {
		const { container } = render(OccupancyPip, { props: { level } });
		expect(container.textContent.trim()).toBe('');
	});

	test('keeps glyph-then-label order and translates the label in Arabic', () => {
		mockLocale = 'ar';
		const { container } = render(OccupancyPip, { props: { level: 'FULL' } });
		const pip = container.querySelector('.occupancy-FULL');
		expect(pip.getAttribute('dir')).toBe('ltr');
		expect(pip.textContent).toContain('ممتلئ');
	});
});
