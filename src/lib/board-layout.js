/**
 * Vertical layout solver for the multi-stop departure board.
 *
 * The board renders inside a fixed 1920×1080 stage that fitStage() uniformly scales to the
 * viewport (see src/routes/stops/[stopID]/+page.svelte), so every dimension here is a known
 * constant and the layout can be solved arithmetically instead of measured. Keeping the math
 * in a pure module means it is testable in the Node workspace without rendering anything.
 *
 * The rule: pick the largest row height that still fits, so leftover panel height turns into
 * bigger type instead of a dead zone under the last card.
 */

export const STAGE_HEIGHT = 1080;
export const PAD_TOP = 26;
export const PAD_BOTTOM = 22;
export const HEADER_HEIGHT = 104;
export const SECTION_GAP = 18;

/** Alert band and footer are fixed-height so the grid area is exactly known. */
export const ALERT_HEIGHT = 128;
export const FOOTER_HEIGHT = 46;

export const CARD_GAP = 20;

/**
 * Everything in a card that is not a departure row: 16px top padding + 36px/1.12 title +
 * 6px meta margin + 16px meta + 10px heading padding + 1px heading rule + 10px bottom
 * padding + 2px card border. Keep in sync with stop-card.svelte.
 */
export const CARD_CHROME_HEIGHT = 102;

/** A stop with nothing to show collapses to a single dim line (see stop-card.svelte). */
export const COLLAPSED_CARD_HEIGHT = 56;

export const MIN_ROW_HEIGHT = 64;
export const MAX_ROW_HEIGHT = 96;
export const MIN_NUMERAL = 48;
export const MAX_NUMERAL = 64;
export const MAX_ROWS_PER_CARD = 6;

/**
 * Grid shape follows the design table: 2 stops → 2 cols; 3–4 → 2 cols; 5–6 → 3 cols.
 * @param {number} stopCount
 * @returns {number}
 */
export function columnsFor(stopCount) {
	if (stopCount <= 2) return Math.max(stopCount, 1);
	return stopCount <= 4 ? 2 : 3;
}

/**
 * Height available to the stop grid once the header, alert band and footer are subtracted.
 * @param {{hasAlert?: boolean, showFooter?: boolean}} [options]
 * @returns {number}
 */
export function gridAreaHeight({ hasAlert = false, showFooter = true } = {}) {
	let height = STAGE_HEIGHT - PAD_TOP - PAD_BOTTOM - HEADER_HEIGHT - SECTION_GAP;
	if (hasAlert) height -= ALERT_HEIGHT + SECTION_GAP;
	if (showFooter) height -= FOOTER_HEIGHT + SECTION_GAP;
	return height;
}

/**
 * Interpolate the minute numeral across the same span the row height travels, so the number
 * grows with its row instead of floating in it.
 * @param {number} rowHeight
 * @returns {number}
 */
function numeralFor(rowHeight) {
	const span = MAX_ROW_HEIGHT - MIN_ROW_HEIGHT;
	const ratio = span === 0 ? 0 : (rowHeight - MIN_ROW_HEIGHT) / span;
	return Math.round(MIN_NUMERAL + ratio * (MAX_NUMERAL - MIN_NUMERAL));
}

/**
 * Try one departures-per-card cap. A grid row is as tall as its tallest card, and a grid row
 * whose cards are all empty costs only a collapsed line.
 * @returns {{gridRows: number, rowHeight: number}|null} null when rows would fall below the floor
 */
function solve(rowCounts, cols, perCard, areaHeight) {
	const gridRows = Math.max(Math.ceil(rowCounts.length / cols), 1);
	let chrome = 0;
	let rows = 0;

	for (let r = 0; r < gridRows; r++) {
		const capped = rowCounts.slice(r * cols, r * cols + cols).map((n) => Math.min(n, perCard));
		const tallest = capped.length ? Math.max(...capped) : 0;
		if (tallest === 0) {
			chrome += COLLAPSED_CARD_HEIGHT;
		} else {
			chrome += CARD_CHROME_HEIGHT;
			rows += tallest;
		}
	}

	const free = areaHeight - CARD_GAP * (gridRows - 1) - chrome;
	if (rows === 0) return { gridRows, rowHeight: MIN_ROW_HEIGHT };
	const raw = free / rows;
	if (raw < MIN_ROW_HEIGHT) return null;
	return { gridRows, rowHeight: Math.floor(Math.min(raw, MAX_ROW_HEIGHT)) };
}

/**
 * Solve the grid for a set of stops.
 * @param {{rowCounts?: number[], maxDepartures?: number, hasAlert?: boolean, showFooter?: boolean}} [options]
 * @returns {{cols: number, gridRows: number, perCard: number, rowHeight: number, numeralSize: number}}
 */
export function computeGridLayout({
	rowCounts = [],
	maxDepartures = MAX_ROWS_PER_CARD,
	hasAlert = false,
	showFooter = true
} = {}) {
	const cols = columnsFor(rowCounts.length);
	const areaHeight = gridAreaHeight({ hasAlert, showFooter });
	const cap = Math.max(Math.min(Math.floor(maxDepartures) || 1, MAX_ROWS_PER_CARD), 1);

	// Prefer showing more departures; only trade rows away when they would not fit at the floor.
	for (let perCard = cap; perCard >= 1; perCard--) {
		const solved = solve(rowCounts, cols, perCard, areaHeight);
		if (solved) {
			return {
				cols,
				gridRows: solved.gridRows,
				perCard,
				rowHeight: solved.rowHeight,
				numeralSize: numeralFor(solved.rowHeight)
			};
		}
	}

	// Unreachable for any realistic stop count, but the board must never render a zero height.
	return {
		cols,
		gridRows: Math.max(Math.ceil(rowCounts.length / cols), 1),
		perCard: 1,
		rowHeight: MIN_ROW_HEIGHT,
		numeralSize: MIN_NUMERAL
	};
}
