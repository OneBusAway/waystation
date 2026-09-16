import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import StopRow from './stop-row.svelte';

function arrival(overrides = {}) {
	return {
		route: '249',
		name: 'Route 249',
		dest: 'South Bellevue Station',
		min: 16,
		delta: 0,
		status: 'ONTIME',
		departureAt: Date.now() + 16 * 60000,
		tripId: 't-1',
		...overrides
	};
}

describe('StopRow status vocabulary', () => {
	afterEach(() => cleanup());

	// Punch list §15: glyph + legend already carry these two states; the word was a third
	// encoding of the same fact.
	test('does not spell out ON TIME', () => {
		const { container } = render(StopRow, { props: { arrival: arrival() } });
		expect(container.textContent).not.toContain('ON TIME');
	});

	test('does not spell out SCHEDULED', () => {
		const { container } = render(StopRow, { props: { arrival: arrival({ status: 'SCHED' }) } });
		expect(container.textContent).not.toContain('SCHEDULED');
	});

	test('still spells out deviations', () => {
		const late = render(StopRow, { props: { arrival: arrival({ status: 'LATE', delta: 1 }) } });
		expect(late.container.textContent).toContain('1 MIN LATE');
		cleanup();
		const early = render(StopRow, { props: { arrival: arrival({ status: 'EARLY', delta: -3 }) } });
		expect(early.container.textContent).toContain('3 MIN EARLY');
	});

	test('still spells out a cancellation, exactly once', () => {
		const { container } = render(StopRow, { props: { arrival: arrival({ status: 'CANCEL' }) } });
		const matches = container.textContent.match(/CANCELED/g) ?? [];
		expect(matches.length).toBe(1);
	});
});

describe('StopRow minutes column', () => {
	afterEach(() => cleanup());

	// Punch list §3: the number must never be the thing that changes color.
	test('paints the numeral constant ink regardless of status', () => {
		const ontime = render(StopRow, { props: { arrival: arrival() } });
		const a = ontime.container.querySelector('[data-testid="minutes"]').style.color;
		cleanup();
		const late = render(StopRow, { props: { arrival: arrival({ status: 'LATE', delta: 4 }) } });
		const b = late.container.querySelector('[data-testid="minutes"]').style.color;
		expect(a).toBe('var(--ink)');
		expect(b).toBe('var(--ink)');
	});

	// Punch list §9: NOW is the loudest thing in its card, and drops the hollow glyph.
	test('renders NOW at full numeral size, heavier, in the accent, with no glyph', () => {
		const { container } = render(StopRow, {
			props: { arrival: arrival({ min: 0, status: 'SCHED' }), numeralSize: 64 }
		});
		const now = container.querySelector('[data-testid="minutes"]');
		expect(now.textContent.trim()).toBe('NOW');
		expect(now.style.fontSize).toBe('64px');
		expect(now.style.fontWeight).toBe('800');
		expect(now.style.color).toBe('var(--accent)');
		expect(container.querySelector('[data-testid="status-glyph"]')).toBeNull();
	});

	// Punch list §8: one fixed right-aligned column so numerals form a single vertical edge.
	test('reserves a fixed minutes column that does not vary with the number of digits', () => {
		const short = render(StopRow, { props: { arrival: arrival({ min: 3 }), numeralSize: 48 } });
		const a = short.container.firstElementChild.style.gridTemplateColumns;
		cleanup();
		const long = render(StopRow, { props: { arrival: arrival({ min: 126 }), numeralSize: 48 } });
		const b = long.container.firstElementChild.style.gridTemplateColumns;
		expect(a).toBe(b);
	});

	// Punch list §11: glyph tracks the numeral instead of drifting per row.
	test('sizes the glyph proportionally to the numeral', () => {
		const { container } = render(StopRow, {
			props: { arrival: arrival({ status: 'LATE', delta: 2 }), numeralSize: 64 }
		});
		const glyph = container.querySelector('[data-testid="status-glyph"]');
		expect(glyph.style.fontSize).toBe(`${Math.round(64 * 0.32)}px`);
	});

	// CANCELED is wider than the fixed minutes track, and the group is right-aligned
	// with overflow: hidden, so the word lost its leading letter. The track is a floor now.
	test('lets the minutes track grow past its floor for a spelled-out status', () => {
		const { container } = render(StopRow, { props: { arrival: arrival({ status: 'CANCEL' }) } });
		const row = container.querySelector('.status-CANCEL');
		expect(row.style.gridTemplateColumns).toBe(
			`auto minmax(0, 1fr) minmax(${Math.round(48 * 2.6)}px, max-content)`
		);
	});

	// Punch list §10: glyph and numeral share one baseline.
	test('baseline-aligns the minutes group', () => {
		const { container } = render(StopRow, { props: { arrival: arrival() } });
		const group = container.querySelector('[data-testid="minutes-group"]');
		expect(group.style.alignItems).toBe('baseline');
		expect(container.querySelector('[data-testid="status-glyph"]').style.alignSelf).toBe('');
	});
});

describe('StopRow route tile', () => {
	afterEach(() => cleanup());

	// Punch list §13: "2 Line" in a fixed 104px tile reads as a black blob.
	test('sizes a word route to its content', () => {
		const { container } = render(StopRow, { props: { arrival: arrival({ route: '2 Line' }) } });
		const tile = container.querySelector('.route-badge');
		expect(tile.style.width).toBe('auto');
		// CSSOM serialises a zero length as `0px`, so the shorthand reads back normalised.
		expect(tile.style.padding).toBe('0px 12px');
	});

	test('keeps the fixed tile for a numeric route', () => {
		const { container } = render(StopRow, { props: { arrival: arrival({ route: '550' }) } });
		const tile = container.querySelector('.route-badge');
		expect(tile.style.width).not.toBe('auto');
		expect(tile.style.padding).toBe('');
	});

	test('uses the chip radius', () => {
		const { container } = render(StopRow, { props: { arrival: arrival() } });
		expect(container.querySelector('.route-badge').style.borderRadius).toBe('var(--radius-chip)');
	});
});

describe('StopRow sizing', () => {
	afterEach(() => cleanup());

	test('takes its height from the solver', () => {
		const { container } = render(StopRow, { props: { arrival: arrival(), rowHeight: 96 } });
		expect(container.firstElementChild.style.height).toBe('96px');
	});
});
