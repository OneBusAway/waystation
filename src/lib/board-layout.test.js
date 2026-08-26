import { describe, test, expect } from 'vitest';
import {
	computeGridLayout,
	columnsFor,
	gridAreaHeight,
	CARD_GAP,
	CARD_CHROME_HEIGHT,
	COLLAPSED_CARD_HEIGHT,
	MIN_ROW_HEIGHT,
	MAX_ROW_HEIGHT,
	MIN_NUMERAL,
	MAX_NUMERAL
} from './board-layout.js';

// Mirrors the stacking in multi-stop-board.svelte so the assertions below stay
// honest if a constant moves: cards must never overflow the area the solver
// claims to be filling.
function usedHeight({ rowCounts, cols, gridRows, perCard, rowHeight }) {
	let total = CARD_GAP * (gridRows - 1);
	for (let r = 0; r < gridRows; r++) {
		const capped = rowCounts.slice(r * cols, r * cols + cols).map((n) => Math.min(n, perCard));
		const tallest = capped.length ? Math.max(...capped) : 0;
		total += tallest === 0 ? COLLAPSED_CARD_HEIGHT : CARD_CHROME_HEIGHT + tallest * rowHeight;
	}
	return total;
}

describe('columnsFor', () => {
	test('follows the design grid table', () => {
		expect(columnsFor(1)).toBe(1);
		expect(columnsFor(2)).toBe(2);
		expect(columnsFor(3)).toBe(2);
		expect(columnsFor(4)).toBe(2);
		expect(columnsFor(5)).toBe(3);
		expect(columnsFor(6)).toBe(3);
	});

	test('never returns zero columns for an empty board', () => {
		expect(columnsFor(0)).toBe(1);
	});
});

describe('gridAreaHeight', () => {
	test('reserves space for the alert band and footer when present', () => {
		const bare = gridAreaHeight({ hasAlert: false, showFooter: false });
		const withFooter = gridAreaHeight({ hasAlert: false, showFooter: true });
		const withBoth = gridAreaHeight({ hasAlert: true, showFooter: true });
		expect(bare).toBeGreaterThan(withFooter);
		expect(withFooter).toBeGreaterThan(withBoth);
		expect(withBoth).toBe(700);
	});
});

describe('computeGridLayout', () => {
	test('grows rows and numerals to fill the area instead of leaving a dead zone', () => {
		const rowCounts = [3, 3, 2, 2];
		const layout = computeGridLayout({
			rowCounts,
			maxDepartures: 4,
			hasAlert: true,
			showFooter: true
		});
		expect(layout.cols).toBe(2);
		expect(layout.gridRows).toBe(2);
		expect(layout.perCard).toBe(4);
		// The old hardcoded 64px left ~35% of the panel blank; the solver must beat it.
		expect(layout.rowHeight).toBeGreaterThan(MIN_ROW_HEIGHT);
		expect(usedHeight({ rowCounts, ...layout })).toBeLessThanOrEqual(700);
		expect(700 - usedHeight({ rowCounts, ...layout })).toBeLessThan(CARD_GAP);
	});

	test('scales the numeral with the row height between its floor and ceiling', () => {
		const dense = computeGridLayout({
			rowCounts: [6, 6, 6, 6, 6, 6],
			maxDepartures: 6,
			hasAlert: true
		});
		const sparse = computeGridLayout({ rowCounts: [1, 1], maxDepartures: 6, hasAlert: true });
		expect(sparse.rowHeight).toBe(MAX_ROW_HEIGHT);
		expect(sparse.numeralSize).toBe(MAX_NUMERAL);
		expect(dense.numeralSize).toBeLessThan(sparse.numeralSize);
		expect(dense.numeralSize).toBeGreaterThanOrEqual(MIN_NUMERAL);
		expect(dense.rowHeight).toBeGreaterThanOrEqual(MIN_ROW_HEIGHT);
	});

	test('pins the numeral to its floor when rows sit at their minimum height', () => {
		const layout = computeGridLayout({ rowCounts: [0, 0], maxDepartures: 4, hasAlert: true });
		expect(layout.rowHeight).toBe(MIN_ROW_HEIGHT);
		expect(layout.numeralSize).toBe(MIN_NUMERAL);
	});

	test('drops departures per card rather than shrinking rows below the floor', () => {
		const rowCounts = [6, 6, 6, 6, 6, 6];
		const layout = computeGridLayout({
			rowCounts,
			maxDepartures: 6,
			hasAlert: true,
			showFooter: true
		});
		expect(layout.cols).toBe(3);
		expect(layout.perCard).toBeLessThan(6);
		expect(layout.rowHeight).toBeGreaterThanOrEqual(MIN_ROW_HEIGHT);
		expect(usedHeight({ rowCounts, ...layout })).toBeLessThanOrEqual(700);
	});

	test('six stops still fit, which is the cap the growth rule must respect', () => {
		const rowCounts = [4, 4, 4, 4, 4, 4];
		const layout = computeGridLayout({ rowCounts, maxDepartures: 4, hasAlert: true });
		expect(layout.perCard).toBeGreaterThanOrEqual(1);
		expect(usedHeight({ rowCounts, ...layout })).toBeLessThanOrEqual(700);
	});

	test('a grid row of only empty stops costs one collapsed line, not a full card', () => {
		const rowCounts = [3, 3, 0, 0];
		const layout = computeGridLayout({ rowCounts, maxDepartures: 4, hasAlert: true });
		// With half the board empty the remaining rows take the maximum height.
		expect(layout.rowHeight).toBe(MAX_ROW_HEIGHT);
		expect(usedHeight({ rowCounts, ...layout })).toBeLessThanOrEqual(700);
	});

	test('never returns a zero or negative row height for a board with no data', () => {
		const layout = computeGridLayout({ rowCounts: [0, 0], maxDepartures: 4, hasAlert: true });
		expect(layout.rowHeight).toBeGreaterThanOrEqual(MIN_ROW_HEIGHT);
		expect(layout.perCard).toBeGreaterThanOrEqual(1);
	});

	test('respects the admin departure limit as an upper bound', () => {
		const layout = computeGridLayout({ rowCounts: [8, 8], maxDepartures: 3, hasAlert: false });
		expect(layout.perCard).toBe(3);
	});
});
