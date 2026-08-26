import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import ClockBlock from './clock-block.svelte';

// 19:52:47 local — the exact moment from the punch list screenshot.
const now = new Date(2026, 7, 25, 19, 52, 47);

describe('ClockBlock', () => {
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
