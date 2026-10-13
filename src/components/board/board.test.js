// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import Board from './board.svelte';

// When a stop has no departures, the board renders the EmptyBoard whose headline
// is driven by emptyMode (see board.svelte). The two axes are independent:
//   has data?  yes: stale / empty    no: error / connecting
// These tests pin every branch. The ordering is easy to invert and a regression
// would silently show a rider the wrong state (e.g. "NO DATA" instead of "NO LIVE DATA"
// when data exists but the feed has gone stale).
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

	test('shows NO DATA when all fetches fail on first load', () => {
		const { container } = renderEmpty({ lastUpdatedAt: null, fetchFailed: true });
		expect(container.innerHTML).toContain('NO DATA');
	});

	test('does not show NO DATA when a fetch fails but data already exists', () => {
		const { container } = renderEmpty({ lastUpdatedAt: now.getTime(), fetchFailed: true });
		expect(container.innerHTML).not.toContain('NO DATA');
	});

	test('shows the failed-stop badge even when the surviving stop has arrivals', () => {
		const { container } = render(Board, {
			props: {
				now,
				lastUpdatedAt: now.getTime(),
				arrivals: [{ tripId: 't1', route: '49', departureAt: now.getTime() + 60_000, min: 1 }],
				failedStopIds: ['1_200']
			}
		});
		expect(container.innerHTML).toContain('DATA UNAVAILABLE FOR STOP');
	});

	test('shows the failed-stop badge with no arrivals at all', () => {
		const { container } = renderEmpty({
			lastUpdatedAt: now.getTime(),
			isStale: false,
			failedStopIds: ['1_200']
		});
		expect(container.innerHTML).toContain('DATA UNAVAILABLE FOR STOP');
		expect(container.innerHTML).toContain('#200');
	});
});

describe('Board departure rows layout and footer containment (Issue #99)', () => {
	afterEach(() => {
		cleanup();
	});

	const now = new Date('2026-06-11T15:55:00Z');

	function makeArrival(index, overrides = {}) {
		return {
			route: `${index + 1}`,
			name: `Route ${index + 1}`,
			dest: `Destination ${index + 1}`,
			departureAt: now.getTime() + (index + 1) * 60_000,
			min: index + 1,
			status: 'ONTIME',
			delta: 0,
			tripId: `trip-${index}`,
			...overrides
		};
	}

	function renderBoard(arrivalsList, props = {}) {
		return render(Board, {
			props: {
				arrivals: arrivalsList,
				now,
				lastUpdatedAt: now.getTime(),
				rowCount: props.rowCount ?? arrivalsList.length,
				showFooter: true,
				...props
			}
		});
	}

	test('A: four or fewer departures continue to fit and render without overflow', () => {
		const fourArrivals = Array.from({ length: 4 }, (_, i) => makeArrival(i));
		const { container } = renderBoard(fourArrivals, { rowCount: 4 });

		const outerGrid = container.firstElementChild;
		expect(outerGrid.style.gridTemplateRows).toContain('minmax(0, 1fr)');

		const rowsContainer = container.querySelector('.departure-rows-container');
		expect(rowsContainer).not.toBeNull();
		expect(rowsContainer.style.overflow).toBe('hidden');
		expect(rowsContainer.style.overflowY).not.toBe('auto');
		expect(rowsContainer.classList.contains('compact')).toBe(false);

		const rows = rowsContainer.querySelectorAll('.row');
		expect(rows.length).toBe(4);
		for (const row of rows) {
			expect(row.classList.contains('compact')).toBe(false);
		}

		const footer = container.querySelector('footer');
		expect(footer).not.toBeNull();
		// Rows container and footer must be separate grid siblings
		expect(footer.parentElement).toBe(outerGrid);
		expect(rowsContainer.nextElementSibling).toBe(footer);
	});

	test('A: renders empty dashed slots when departures are fewer than rowCount <= 4', () => {
		const twoArrivals = Array.from({ length: 2 }, (_, i) => makeArrival(i));
		const { container } = renderBoard(twoArrivals, { rowCount: 4 });

		const rowsContainer = container.querySelector('.departure-rows-container');
		const rows = rowsContainer.querySelectorAll('.row');
		expect(rows.length).toBe(2);

		// Remaining 2 slots are empty dashed borders
		const emptySlots = rowsContainer.querySelectorAll('div[style*="border-bottom: 1px dashed"]');
		expect(emptySlots.length).toBe(2);
	});

	test('B: five departures stay contained within the rows track, switch to compact mode, and do not scroll or overlap the footer', () => {
		const fiveArrivals = Array.from({ length: 5 }, (_, i) => makeArrival(i));
		const { container } = renderBoard(fiveArrivals, { rowCount: 5 });

		const outerGrid = container.firstElementChild;
		// Outer grid track 4 must be constrained with minmax(0, 1fr) so it never expands past available space
		expect(outerGrid.style.gridTemplateRows).toContain('minmax(0, 1fr)');

		const rowsContainer = container.querySelector('.departure-rows-container');
		expect(rowsContainer).not.toBeNull();
		expect(rowsContainer.style.overflow).toBe('hidden');
		expect(rowsContainer.style.overflowY).not.toBe('auto');
		expect(['0', '0px']).toContain(rowsContainer.style.minHeight);
		expect(rowsContainer.classList.contains('compact')).toBe(true);

		const rows = rowsContainer.querySelectorAll('.row');
		expect(rows.length).toBe(5);

		// All 5 rows must be inside rowsContainer and in compact mode
		for (const row of rows) {
			expect(rowsContainer.contains(row)).toBe(true);
			expect(row.classList.contains('compact')).toBe(true);
		}

		// The footer must exist, be positioned as a separate grid item, and not contain any departure rows
		const footer = container.querySelector('footer');
		expect(footer).not.toBeNull();
		expect(footer.querySelector('.row')).toBeNull();
		expect(footer.parentElement).toBe(outerGrid);
		expect(rowsContainer.nextElementSibling).toBe(footer);
	});

	test('C: high maxDepartures clamps to MAX_BOARD_ROWS (5) so the board stays contained in compact mode', () => {
		// computeScreenWindow clamps single-screen display to MAX_BOARD_ROWS
		const fiveArrivals = Array.from({ length: 5 }, (_, i) => makeArrival(i));
		const { container } = renderBoard(fiveArrivals, { rowCount: 5 });

		const rowsContainer = container.querySelector('.departure-rows-container');
		expect(rowsContainer).not.toBeNull();
		expect(rowsContainer.style.overflow).toBe('hidden');
		expect(rowsContainer.classList.contains('compact')).toBe(true);

		const rows = rowsContainer.querySelectorAll('.row');
		expect(rows.length).toBe(5);

		// Each row must be present and display its route and destination
		fiveArrivals.forEach((arr, i) => {
			expect(rows[i].textContent).toContain(arr.name);
			expect(rows[i].textContent).toContain(arr.dest);
		});

		// Footer remains visible at the bottom of the outer grid
		const footer = container.querySelector('footer');
		expect(footer).not.toBeNull();
		expect(footer.innerHTML).toContain('WAYSTATION');
	});

	test('D: responsive layout maintains grid constraints and stage containment', () => {
		const fiveArrivals = Array.from({ length: 5 }, (_, i) => makeArrival(i));
		const { container } = renderBoard(fiveArrivals, { rowCount: 5 });

		const outerGrid = container.firstElementChild;
		// Position absolute with inset 0 fills the stage container regardless of viewport scaling
		expect(outerGrid.style.position).toBe('absolute');
		expect(['0', '0px']).toContain(outerGrid.style.inset);

		const rowsContainer = container.querySelector('.departure-rows-container');
		expect(rowsContainer.style.overflow).toBe('hidden');
		expect(['0', '0px']).toContain(rowsContainer.style.minHeight);
	});

	test('E: variable content such as long destination and route names remain contained', () => {
		const longArrivals = [
			makeArrival(0, {
				name: 'Very Long Route Name That Could Exceed Normal Width 550 Express',
				dest: 'Downtown Seattle via Bellevue Transit Center and Mercer Island Park & Ride',
				route: '550EXP'
			}),
			makeArrival(1, {
				name: 'Edmonds - Kingston Ferry Terminal Shuttle Route',
				dest: 'Edmonds Kingston Terminal Southbound Connection Point',
				route: 'FERRY'
			}),
			makeArrival(2),
			makeArrival(3),
			makeArrival(4)
		];
		const { container } = renderBoard(longArrivals, {
			rowCount: 5,
			stopSubtitle: 'Platform 3 · Southbound Bay A / Bay B Long Subtitle'
		});

		const rowsContainer = container.querySelector('.departure-rows-container');
		const rows = rowsContainer.querySelectorAll('.row');
		expect(rows.length).toBe(5);

		// Elements with long text must have ellipsis and hidden overflow in their inline styles
		const longNameEl = rows[0].querySelector('.display');
		expect(longNameEl.style.textOverflow).toBe('ellipsis');
		expect(longNameEl.style.overflow).toBe('hidden');

		// Footer is still present and unaffected
		const footer = container.querySelector('footer');
		expect(footer).not.toBeNull();
	});

	test('F: configuration with varying rowCount maintains bounded board area', () => {
		const fourArrivals = Array.from({ length: 4 }, (_, i) => makeArrival(i));
		const { container: container4 } = renderBoard(fourArrivals, { rowCount: 4 });
		const rows4 = container4.querySelector('.departure-rows-container');
		expect(rows4.style.gridTemplateRows).toBe('repeat(4, minmax(0, 1fr))');
		expect(rows4.classList.contains('compact')).toBe(false);
		expect(rows4.style.overflow).toBe('hidden');

		cleanup();

		const fiveArrivals = Array.from({ length: 5 }, (_, i) => makeArrival(i));
		const { container: container5 } = renderBoard(fiveArrivals, { rowCount: 5 });
		const rows5 = container5.querySelector('.departure-rows-container');
		expect(rows5.style.gridTemplateRows).toBe('repeat(5, minmax(0, 1fr))');
		expect(rows5.classList.contains('compact')).toBe(true);
		expect(rows5.style.overflow).toBe('hidden');

		// Footer remains strictly in place
		const footer = container5.querySelector('footer');
		expect(footer).not.toBeNull();
		expect(footer.innerHTML).toContain('WAYSTATION');
	});
});
