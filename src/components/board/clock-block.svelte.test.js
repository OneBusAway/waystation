import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import ClockBlock from './clock-block.svelte';

// 19:52:47 local — the exact moment from the punch list screenshot.
const now = new Date(2026, 7, 25, 19, 52, 47);

// Mock state for controlling getLocale() behavior
let mockLocale = 'en';

vi.mock('$lib/paraglide/runtime.js', () => ({
	getLocale: () => mockLocale
}));

describe('ClockBlock', () => {
	beforeEach(() => {
		mockLocale = 'en';
	});

	afterEach(() => cleanup());

	test('does not render live seconds', () => {
		const { container } = render(ClockBlock, { props: { now } });
		const clock = container.querySelector('[data-testid="clock"]');
		expect(clock.textContent).not.toContain('47');
		expect(clock.textContent).not.toContain(':47');
	});

	test('renders hour, minute and meridiem in that reading order', () => {
		const { container } = render(ClockBlock, { props: { now } });
		const text = container.querySelector('[data-testid="clock"]').textContent.replace(/\s+/g, '');
		expect(text).toBe('7:52PM');
	});

	test('keeps the clock tabular so it does not shift width every minute', () => {
		const { container } = render(ClockBlock, { props: { now } });
		expect(container.querySelector('[data-testid="clock"]').className).toContain('tnum');
	});

	test('kerns the colon tighter than the default advance width', () => {
		const { container } = render(ClockBlock, { props: { now } });
		const separator = container.querySelector('[data-testid="clock-separator"]');
		expect(separator.style.margin).toBe('0px -0.04em');
	});

	test('renders the same string one second later', () => {
		const a = render(ClockBlock, { props: { now } });
		const first = a.container.querySelector('[data-testid="clock"]').textContent;
		cleanup();
		const b = render(ClockBlock, { props: { now: new Date(2026, 7, 25, 19, 52, 48) } });
		expect(b.container.querySelector('[data-testid="clock"]').textContent).toBe(first);
	});
});

describe('ClockBlock (Arabic/RTL)', () => {
	beforeEach(() => {
		mockLocale = 'ar';
	});

	afterEach(() => {
		mockLocale = 'en';
		cleanup();
	});

	test('places meridiem before numeric group in RTL reading order and uses Western Arabic numerals', () => {
		// Test exercises the RTL path where meridiem appears before numeric group.
		// This test protects against regressions when the Arabic locale is used.
		const { container } = render(ClockBlock, { props: { now } });

		const clock = container.querySelector('[data-testid="clock"]');
		const children = Array.from(clock.children);

		// Find the meridiem span (AM/PM equivalent in Arabic) and the numeric span
		const numericSpan = children.find(
			(el) =>
				el.textContent.includes(':') &&
				(el.textContent.includes('7') || el.textContent.includes('52'))
		);
		const meridiemSpan = children.find((el) => el !== numericSpan && el.textContent.length > 0);

		// Assert that meridiem appears BEFORE numeric group in DOM order (RTL behavior)
		expect(meridiemSpan).toBeDefined();
		expect(numericSpan).toBeDefined();
		const meridiemIndex = children.indexOf(meridiemSpan);
		const numericIndex = children.indexOf(numericSpan);
		expect(meridiemIndex).toBeLessThan(numericIndex);

		// Assert Western Arabic numerals are used (Latin numerals via -u-nu-latn extension)
		expect(numericSpan.textContent).toContain('7');
		expect(numericSpan.textContent).toContain('52');
	});
});
