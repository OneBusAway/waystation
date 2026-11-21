import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import AlertBadge from './alert-badge.svelte';

let mockLocale = 'en';

vi.mock('$lib/paraglide/runtime.js', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		getLocale: () => mockLocale
	};
});

vi.mock('$lib/formatters.js', async (importOriginal) => ({
	...(await importOriginal()),
	translate: (text) => Promise.resolve(text)
}));

beforeEach(() => {
	mockLocale = 'en';
});

function situation(severity) {
	return {
		summary: { value: 'Service advisory' },
		severity,
		activeWindows: []
	};
}

describe('AlertBadge severity', () => {
	afterEach(() => cleanup());

	test.each([
		['severe', 'alert-alert'],
		['verySevere', 'alert-alert'],
		['normal', 'alert-advisory'],
		['slight', 'alert-info'],
		['noImpact', 'alert-info']
	])('maps upstream severity %s to %s', (severity, expectedClass) => {
		const { container } = render(AlertBadge, {
			props: { situation: situation(severity) }
		});

		expect(container.querySelector(`.${expectedClass}`)).not.toBeNull();
	});

	test('uses the advisory tone for an unknown severity', () => {
		const { container } = render(AlertBadge, {
			props: { situation: situation('somethingNew') }
		});

		expect(container.querySelector('.alert-advisory')).not.toBeNull();
	});

	test('uses the advisory tone when severity is missing', () => {
		const { container } = render(AlertBadge, {
			props: { situation: situation(undefined) }
		});

		expect(container.querySelector('.alert-advisory')).not.toBeNull();
	});
});
