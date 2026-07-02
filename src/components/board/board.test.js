// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import Board from './board.svelte';

// When a stop has no departures, the board renders the EmptyBoard whose headline
// is driven by `emptyMode = !updatedDate && fetchFailed ? 'error' : !updatedDate ? 'connecting' : stale ? 'stale' : 'empty'`.
// These tests pin that branching — the ternary ordering is easy to invert, and a
// regression would silently show a rider the wrong state (e.g. "CONNECTING" forever
// when the live feed is actually stale or down).
describe('Board empty state', () => {
	afterEach(() => {
		cleanup();
	});

	const now = new Date('2026-06-11T15:55:00Z');

	function renderEmpty(props) {
		return render(Board, { props: { arrivals: [], now, ...props } });
	}

	test('shows CONNECTING before the first fetch resolves', () => {
		const { container } = renderEmpty({ lastUpdatedAt: null });
		expect(container.innerHTML).toContain('CONNECTING');
	});

	test('shows NO DATA when all fetches fail on first load', () => {
		const { container } = renderEmpty({ lastUpdatedAt: null, fetchFailed: true });
		expect(container.innerHTML).toContain('NO DATA');
	});

	test('shows NO DEPARTURES once loaded with no service', () => {
		const { container } = renderEmpty({ lastUpdatedAt: now.getTime(), isStale: false });
		expect(container.innerHTML).toContain('NO DEPARTURES');
	});

	test('shows NO LIVE DATA when the upstream feed is flagged stale', () => {
		const { container } = renderEmpty({ lastUpdatedAt: now.getTime(), isStale: true });
		expect(container.innerHTML).toContain('NO LIVE DATA');
	});

	test('shows NO LIVE DATA when data ages past the 90s staleness threshold', () => {
		const { container } = renderEmpty({ lastUpdatedAt: now.getTime() - 91_000, isStale: false });
		expect(container.innerHTML).toContain('NO LIVE DATA');
	});
});
