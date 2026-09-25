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

	// The complement of the test above, and the one that matters more. The derivations are keyed
	// off the truncated minute so they don't rebuild an Intl.DateTimeFormat 86,400 times a day.
	// These must update a LIVE instance via rerender rather than mounting a second component:
	// two separate renders always re-derive, so they would catch a wrong truncation granularity
	// but never a clock that has stopped tracking its dependency — which is the failure that
	// would strand a kiosk showing the same time for days while every other test still passed.
	test('advances a live instance when the minute rolls over', async () => {
		const { container, rerender } = render(ClockBlock, { props: { now } });
		const clock = () => container.querySelector('[data-testid="clock"]').textContent;
		expect(clock().replace(/\s+/g, '')).toBe('7:52PM');

		await rerender({ now: new Date(2026, 7, 25, 19, 52, 59) });
		expect(clock().replace(/\s+/g, '')).toBe('7:52PM');

		await rerender({ now: new Date(2026, 7, 25, 19, 53, 4) });
		expect(clock().replace(/\s+/g, '')).toBe('7:53PM');
	});

	test('advances the date line of a live instance across midnight', async () => {
		const { container, rerender } = render(ClockBlock, {
			props: { now: new Date(2026, 7, 25, 23, 59, 30) }
		});
		const before = container.textContent;
		await rerender({ now: new Date(2026, 7, 26, 0, 0, 30) });
		expect(container.textContent).not.toBe(before);
	});

	// Pins the efficiency claim the comment above `minuteMs` makes, rather than trusting it. An
	// earlier attempt truncated to a `Date` object instead of a number; because $derived compares
	// with ===, a fresh object invalidated its dependents every single tick and the optimisation
	// silently did nothing while every other test still passed. This is the test that catches it.
	test('rebuilds the formatter once per minute, not once per second', async () => {
		const RealDateTimeFormat = Intl.DateTimeFormat;
		let constructions = 0;
		// Construct through to the real implementation — a bare spy returns an object whose
		// prototype chain breaks `formatToParts`.
		const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (...args) {
			constructions += 1;
			return Reflect.construct(RealDateTimeFormat, args);
		});

		try {
			const { rerender } = render(ClockBlock, {
				props: { now: new Date(2026, 7, 25, 19, 52, 0) }
			});
			const afterMount = constructions;

			for (let second = 1; second <= 59; second += 1) {
				await rerender({ now: new Date(2026, 7, 25, 19, 52, second) });
			}
			expect(constructions).toBe(afterMount);

			await rerender({ now: new Date(2026, 7, 25, 19, 53, 0) });
			expect(constructions).toBeGreaterThan(afterMount);
		} finally {
			spy.mockRestore();
		}
	});
});

describe('ClockBlock hourCycle', () => {
	afterEach(() => {
		mockLocale = 'en';
		cleanup();
	});

	const clockText = (props) =>
		render(ClockBlock, { props: { now, ...props } })
			.container.querySelector('[data-testid="clock"]')
			.textContent.replace(/\s+/g, '');

	test('h12 adds a meridiem for de', () => {
		mockLocale = 'de';
		expect(clockText({ hourCycle: 'h12' })).toBe('7:52PM');
	});

	test('h23 drops the meridiem for en', () => {
		expect(clockText({ hourCycle: 'h23' })).toBe('19:52');
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
