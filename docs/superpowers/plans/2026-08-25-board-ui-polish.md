# Board UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all 19 items of the board UI punch list so the multi-stop departure board fills its 1080px panel, reads cleanly at kiosk distance, and applies one consistent color rule.

**Architecture:** The board renders inside a fixed 1920×1080 stage that `fitStage()` uniformly scales to the viewport, so every dimension is a known constant and the layout can be *solved arithmetically* rather than measured. The largest change extracts that arithmetic into a new pure module, `src/lib/board-layout.js`, which turns a per-stop departure count into `{cols, gridRows, perCard, rowHeight, numeralSize}`. Everything else is prop-threading and CSS: `multi-stop-board.svelte` calls the solver and passes sizes down through `stop-card.svelte` into `stop-row.svelte`, while shared tone/radius/edge decisions move into tokens in `src/app.css`.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes (`$state`/`$props`/`$derived`), Tailwind CSS v4 with CSS custom properties, Vitest (client workspace = jsdom + `@testing-library/svelte` for `*.svelte.test.js`; server workspace = Node for `*.test.js`), inlang Paraglide for i18n.

**Spec:** `docs/superpowers/specs/2026-08-25-board-ui-polish-punchlist.md` — read it first, including the "Corrections to this spec" section at the bottom, which overrides the spec body where they conflict.

## Global Constraints

- **Formatting:** tabs, single quotes, no trailing commas, 100-char line width. Run `npm run format` before every commit; `npm run lint` must pass.
- **Svelte 5 runes only:** `$state`, `$props`, `$derived`, `$effect`. No Svelte 4 stores.
- **Fixed `px` only** inside `/stops/[stopID]` and `src/components/board/*`. The stage handles scaling; never introduce `vw`/`vh`/`rem` in these files.
- **Path aliases:** `$components` → `./src/components`, `$lib` → `./src/lib`.
- **All user-visible strings go through Paraglide.** `import * as t from '$lib/paraglide/messages.js'`. Any new key must be added to all five locales: `messages/{en,de,ar,es,fr}.json`.
- **Both themes and both color modes must keep working.** Every color must resolve through a token so `.theme-dark`, `.theme-light`, and `.theme-mono` all stay correct. Never hardcode a hex in a component.
- **Component tests** are named `*.svelte.test.js` (client workspace). Run a single file with `npx vitest run <path>`.
- **Stage geometry is authoritative:** stage 1920×1080, board padding `26px 32px 22px`, header 104px, section gap 18px, card gap 20px.

---

## File Structure

**Created:**
- `src/lib/board-layout.js` — pure layout solver. Owns every vertical constant of the board and the search for a `perCard`/`rowHeight` pair that fills the grid area. No DOM, no Svelte.
- `src/lib/board-layout.test.js` — Node-workspace unit tests for the solver.
- `src/components/board/stop-row.svelte.test.js` — row rendering: minutes column, NOW, status-word de-duplication, route tile shape.
- `src/components/board/stop-card.svelte.test.js` — card heading split, collapsed empty variant.
- `src/components/board/clock-block.svelte.test.js` — clock has no seconds, meridiem placement.
- `src/components/board/alert-band.svelte.test.js` — eyebrow/headline/body/date-window structure and severity tone class.

**Modified:**
- `src/lib/formatters.js` — add `splitStopName()`, `formatAlertWindow()`, `alertTone()`.
- `src/lib/formatters.test.js` — tests for the three new functions.
- `src/app.css:92-124` — light/dark tokens: `--card-edge`, `--badge-ink` cream fix, radius scale.
- `src/components/board/multi-stop-board.svelte` — call the solver, sort empty stops last, add the column rule, header lockup.
- `src/components/board/stop-card.svelte` — heading hierarchy, name/bay split, collapsed empty variant, radius/edge.
- `src/components/board/stop-row.svelte` — minutes column, NOW, baselines, glyph sizing, status-word de-duplication, constant-ink numeral, route tile shape.
- `src/components/board/clock-block.svelte` — drop seconds, kern the colon.
- `src/components/board/alert-band.svelte` — eyebrow + 2-line headline + body, date window, severity tone.
- `src/components/board/multi-stop-board.svelte.test.js` — update assertions that the layout change invalidates.
- `messages/{en,de,ar,es,fr}.json` — new keys.

---

## Task 1: Layout solver (`board-layout.js`) — §1, §2 sizing

The board's dead zone exists because `rowHeight` is a hardcoded 64/78 and `perCard` a hardcoded 4/6. This task replaces both with a solver that spends the leftover height on row height and numeral size, and shrinks `perCard` only when rows would fall below their 64px floor.

**Files:**
- Create: `src/lib/board-layout.js`
- Test: `src/lib/board-layout.test.js`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces:
  - `computeGridLayout({ rowCounts: number[], maxDepartures: number, hasAlert: boolean, showFooter: boolean }) => { cols: number, gridRows: number, perCard: number, rowHeight: number, numeralSize: number }`
  - `columnsFor(stopCount: number) => number`
  - `gridAreaHeight({ hasAlert: boolean, showFooter: boolean }) => number`
  - Named constants: `CARD_GAP`, `CARD_CHROME_HEIGHT`, `COLLAPSED_CARD_HEIGHT`, `MIN_ROW_HEIGHT`, `MAX_ROW_HEIGHT`, `MIN_NUMERAL`, `MAX_NUMERAL`, `MAX_ROWS_PER_CARD`, `ALERT_HEIGHT`, `FOOTER_HEIGHT`.
  - `rowCounts` is one entry per stop, in render order, each the number of arrivals that stop has available (not yet capped by `perCard`). A `0` means the card will collapse.

- [ ] **Step 1: Write the failing test**

Create `src/lib/board-layout.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/board-layout.test.js`
Expected: FAIL — `Failed to resolve import "./board-layout.js"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/board-layout.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/board-layout.test.js`
Expected: PASS, 11 tests.

Reference values from a verified run of exactly this solver, useful if a number comes out different: `[3, 3, 2, 2]` at `maxDepartures: 4` with an alert and a footer yields `{cols: 2, gridRows: 2, perCard: 4, rowHeight: 95, numeralSize: 64}` and consumes 699 of the 700 available pixels. Six stops of six departures yields `{cols: 3, gridRows: 2, perCard: 3, rowHeight: 79, numeralSize: 56}` and consumes 698. `[3, 3, 0, 0]` yields `rowHeight: 96` — the ceiling — because the collapsed row frees 46px.

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/lib/board-layout.js src/lib/board-layout.test.js
git commit -m "feat(board): add pure layout solver that fills the panel height"
```

---

## Task 2: Formatter helpers and message keys — §5, §7, §2 copy

Three pure helpers the components need, plus every new translation key in one place so no later task has to touch `messages/`.

**Files:**
- Modify: `src/lib/formatters.js` (append after `formatTimestamp`, around line 318)
- Modify: `src/lib/formatters.test.js`
- Modify: `messages/en.json`, `messages/de.json`, `messages/ar.json`, `messages/es.json`, `messages/fr.json`

**Interfaces:**
- Consumes: `getLocale()` from `./paraglide/runtime` (already imported at the top of `formatters.js`).
- Produces:
  - `splitStopName(name: string) => { name: string, bay: string }` — `'120th Ave NE & NE Spring Blvd - Bay 1'` → `{ name: '120th Ave NE & NE Spring Blvd', bay: 'Bay 1' }`.
  - `formatAlertWindow(timestamp: number) => string` — `'Aug 18'` (no weekday, no year).
  - `alertTone(severity: string) => 'info' | 'advisory' | 'alert'` — maps the OBA severity vocabulary onto the three tones `app.css` paints.
  - New message keys: `board_stop_code`, `board_no_departures_inline`.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/formatters.test.js`:

```js
describe('splitStopName', () => {
	test('lifts a hyphenated bay suffix out of the stop name', () => {
		expect(splitStopName('120th Ave NE & NE Spring Blvd - Bay 1')).toEqual({
			name: '120th Ave NE & NE Spring Blvd',
			bay: 'Bay 1'
		});
	});

	test('handles en dash and em dash separators', () => {
		expect(splitStopName('Main St – Bay 4').bay).toBe('Bay 4');
		expect(splitStopName('Main St — Bay 4').bay).toBe('Bay 4');
	});

	test('handles a parenthesised bay', () => {
		expect(splitStopName('Transit Center (Bay C)')).toEqual({
			name: 'Transit Center',
			bay: 'Bay C'
		});
	});

	test('normalises the word Bay but preserves the bay identifier', () => {
		expect(splitStopName('Depot - BAY D-3').bay).toBe('Bay D-3');
	});

	test('leaves a name with no bay untouched', () => {
		expect(splitStopName('Pine St & 3rd Ave')).toEqual({
			name: 'Pine St & 3rd Ave',
			bay: ''
		});
	});

	test('does not mistake a hyphenated place name for a bay', () => {
		expect(splitStopName('Bellevue - Downtown')).toEqual({
			name: 'Bellevue - Downtown',
			bay: ''
		});
	});

	test('tolerates missing or non-string input', () => {
		expect(splitStopName(undefined)).toEqual({ name: '', bay: '' });
		expect(splitStopName(null)).toEqual({ name: '', bay: '' });
	});
});

describe('formatAlertWindow', () => {
	test('drops the weekday and the year', () => {
		const result = formatAlertWindow(new Date('2026-08-18T12:00:00Z').getTime());
		expect(result).toContain('18');
		expect(result).not.toMatch(/2026/);
		expect(result).not.toMatch(/Tue|Tuesday/i);
	});
});

describe('alertTone', () => {
	test('maps the OBA severity vocabulary onto the three painted tones', () => {
		expect(alertTone('severe')).toBe('alert');
		expect(alertTone('verySevere')).toBe('alert');
		expect(alertTone('normal')).toBe('advisory');
		expect(alertTone('slight')).toBe('info');
		expect(alertTone('verySlight')).toBe('info');
		expect(alertTone('noImpact')).toBe('info');
	});

	test('passes through a value that is already a board tone', () => {
		expect(alertTone('info')).toBe('info');
		expect(alertTone('advisory')).toBe('advisory');
		expect(alertTone('alert')).toBe('alert');
	});

	test('is insensitive to case, spaces and separators', () => {
		expect(alertTone('VERY_SEVERE')).toBe('alert');
		expect(alertTone('very severe')).toBe('alert');
		expect(alertTone('very-severe')).toBe('alert');
	});

	// Regression: an unmapped value used to produce a class with no --alert-tone,
	// which is why the 6px severity bar never drew on the deployed board.
	test('falls back to advisory so a tone is always defined', () => {
		expect(alertTone('unknown')).toBe('advisory');
		expect(alertTone('')).toBe('advisory');
		expect(alertTone(undefined)).toBe('advisory');
		expect(alertTone(null)).toBe('advisory');
	});
});
```

Add the three names to the existing named-import block at the top of `src/lib/formatters.test.js` — note it imports from `$lib/formatters` (no extension), not a relative path: `alertTone`, `formatAlertWindow`, `splitStopName`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/formatters.test.js`
Expected: FAIL — `splitStopName is not a function` (and the same for the other two).

- [ ] **Step 3: Write the implementation**

Append to `src/lib/formatters.js`:

```js
// A trailing bay belongs in the card's meta line next to the stop code and direction, not in
// the title. Both separators the feeds use are matched; a bare hyphenated place name
// ("Bellevue - Downtown") must not be treated as a bay, hence the explicit "bay" keyword.
const BAY_SUFFIX = /\s*[-–—]\s*(bay\s+[\w-]+)\s*$/i;
const BAY_PARENTHESISED = /\s*\((bay\s+[\w-]+)\)\s*$/i;

/**
 * Split a trailing bay designator off a stop name.
 *
 * @param {string} name - Raw stop name from the feed
 * @returns {{name: string, bay: string}} - Title text and bay label ('' when there is no bay)
 */
export function splitStopName(name) {
	const raw = typeof name === 'string' ? name.trim() : '';

	for (const pattern of [BAY_SUFFIX, BAY_PARENTHESISED]) {
		const match = raw.match(pattern);
		if (match) {
			// Normalise the keyword's casing but leave the identifier alone, so "BAY D-3" becomes
			// "Bay D-3" rather than "Bay d-3".
			const bay = match[1].replace(/\s+/g, ' ').replace(/^bay/i, 'Bay');
			return { name: raw.slice(0, match.index).trim(), bay };
		}
	}

	return { name: raw, bay: '' };
}

/**
 * Format an alert's active-window boundary for the board's right rail. The board already
 * states today's date in the header, so the weekday and year are noise here.
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - A short date like "Aug 18"
 */
export function formatAlertWindow(timestamp) {
	return new Date(timestamp).toLocaleDateString(`${getLocale()}`, {
		month: 'short',
		day: 'numeric'
	});
}

// OBA reports severity with the GTFS-RT vocabulary, which has seven values; the board paints
// three tones. Without this mapping the severity class matched no CSS rule, so --alert-tone
// was never set and the 6px severity bar and background tint silently did not render.
const SEVERITY_TONES = {
	noimpact: 'info',
	veryslight: 'info',
	slight: 'info',
	normal: 'advisory',
	severe: 'alert',
	verysevere: 'alert',
	// A feed that already speaks the board's own vocabulary passes straight through.
	info: 'info',
	advisory: 'advisory',
	alert: 'alert'
};

/**
 * Map an OBA situation severity onto one of the board's three alert tones.
 *
 * @param {string} severity - Raw severity string from OBA
 * @returns {'info'|'advisory'|'alert'} - Always a tone the stylesheet defines
 */
export function alertTone(severity) {
	const key = String(severity ?? '')
		.toLowerCase()
		.replace(/[\s_-]/g, '');
	return SEVERITY_TONES[key] ?? 'advisory';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/formatters.test.js`
Expected: PASS.

- [ ] **Step 5: Add the message keys to all five locales**

Add these two keys to each of `messages/en.json`, `de.json`, `ar.json`, `es.json`, `fr.json`. `board_stop_code` replaces the `STOP #{stopId}` framing in the card meta line (§7); `board_no_departures_inline` is the collapsed empty line (§2), written in sentence case because §2 drops the letterspaced-caps treatment.

`messages/en.json`:
```json
	"board_stop_code": "#{stopId}",
	"board_no_departures_inline": "No upcoming departures",
```

`messages/de.json`:
```json
	"board_stop_code": "#{stopId}",
	"board_no_departures_inline": "Keine bevorstehenden Abfahrten",
```

`messages/es.json`:
```json
	"board_stop_code": "#{stopId}",
	"board_no_departures_inline": "No hay próximas salidas",
```

`messages/fr.json`:
```json
	"board_stop_code": "#{stopId}",
	"board_no_departures_inline": "Aucun départ à venir",
```

`messages/ar.json`:
```json
	"board_stop_code": "#{stopId}",
	"board_no_departures_inline": "لا توجد رحلات مغادرة قادمة",
```

- [ ] **Step 6: Regenerate the Paraglide runtime and verify the keys resolve**

Run: `npm run build`
Expected: build succeeds and `src/lib/paraglide/messages.js` now exports `board_stop_code` and `board_no_departures_inline`. Confirm with:

```bash
LC_ALL=C grep -c 'board_no_departures_inline' src/lib/paraglide/messages.js
```
Expected: a non-zero count.

- [ ] **Step 7: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/lib/formatters.js src/lib/formatters.test.js messages/
git commit -m "feat(board): add stop-name, alert-window and severity-tone helpers"
```

---

## Task 3: Shared tokens — §12 radii, §13 badge ink, §14 card edge

Three decisions that must be made once and consumed everywhere, so no component hardcodes a hex or a radius. There is no unit test here: jsdom does not apply the global stylesheet, so computed styles from `app.css` are not observable in a component test. Verification is a grep for the tokens plus the visual pass in Task 10.

**Files:**
- Modify: `src/app.css:92-124` (light theme block, dark theme block, and the `.theme-departure` base)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties available to every board component —
  - `--radius-container: 8px` (cards, alert band)
  - `--radius-chip: 6px` (route tiles, alert glyph box)
  - `--card-edge` (per-theme card border color)
  - `--badge-ink` in light mode changes from `#d4b14a` to `#f5f3ee`

- [ ] **Step 1: Add the radius scale to the theme base**

In `src/app.css`, inside the `.theme-departure` rule (currently lines 52-56), add the two radius tokens:

```css
.theme-departure {
	font-family: 'IBM Plex Sans', system-ui, sans-serif;
	background: var(--bg);
	color: var(--ink);

	/* Two radii only: containers (cards, alert band) and chips (route tiles, glyph boxes).
	   Previously these were four different inline values between 0 and 8px. */
	--radius-container: 8px;
	--radius-chip: 6px;
}
```

- [ ] **Step 2: Add `--card-edge` to the dark theme**

In the `.theme-departure.theme-dark` block, add after the `--rule-strong` line:

```css
	--card-edge: var(--brand-card-edge, var(--rule));
```

- [ ] **Step 3: Add `--card-edge` and fix `--badge-ink` in the light theme**

In the `.theme-departure.theme-light` block, add after the `--rule-strong` line:

```css
	/* A #c7c4bd hairline on #f5f3ee is invisible at kiosk distance; ink at 12% is crisp
	   without turning the paper board into a web card. No blur, no soft shadow. */
	--card-edge: var(--brand-card-edge, color-mix(in srgb, var(--ink) 12%, transparent));
```

and change the `--badge-ink` line from:

```css
	--badge-ink: var(--brand-badge-ink, #d4b14a);
```

to:

```css
	/* Cream on the near-black tile, per the design spec. Warm amber was a dark-theme value
	   that leaked into light mode. */
	--badge-ink: var(--brand-badge-ink, #f5f3ee);
```

- [ ] **Step 4: Verify the tokens resolve and nothing else regressed**

Run:
```bash
LC_ALL=C grep -n 'radius-container\|radius-chip\|card-edge\|badge-ink' src/app.css
npm run build
npm test
```
Expected: the grep shows `--radius-container` and `--radius-chip` once in the base, `--card-edge` once per theme block, `--badge-ink` once per theme block with light now `#f5f3ee`. The build succeeds and the existing suite still passes (no test asserts on these values yet).

Note: `.theme-mono.theme-light` (line ~211) already overrides `--badge-ink` to `var(--bg)`, which is the same cream — mono light is unaffected by this change. `src/components/board/route-badge.svelte` (the single-stop board's tile) also reads `--badge-ink` and will pick up the cream; that is intended. Its geometry is out of scope for this plan.

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/app.css
git commit -m "style(board): unify radii, add card edge token, fix light badge ink"
```

---

## Task 4: Departure row — §3, §8, §9, §10, §11, §13, §15

The row is where most of the punch list lands. It gains two size props from the solver and loses its status-tinted numeral.

**Files:**
- Modify: `src/components/board/stop-row.svelte` (full rewrite of the component)
- Test: `src/components/board/stop-row.svelte.test.js`

**Interfaces:**
- Consumes: `t` from `$lib/paraglide/messages.js`.
- Produces: `<StopRow arrival={Arrival} last={boolean} rowHeight={number} numeralSize={number} />`
  - `rowHeight` and `numeralSize` come from `computeGridLayout()` via `stop-card.svelte`. Defaults `64` / `48` preserve the pre-solver appearance.
  - `Arrival` is the existing model: `{ route, name, dest, min, delta, status, departureAt, tripId }` where `status` is one of `ONTIME | EARLY | LATE | CANCEL | SCHED`.
  - The row now owns its own height (`height: {rowHeight}px`); the parent must no longer set `grid-auto-rows`.

- [ ] **Step 1: Write the failing test**

Create `src/components/board/stop-row.svelte.test.js`:

```js
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

	test('still spells out a cancellation', () => {
		const { container } = render(StopRow, { props: { arrival: arrival({ status: 'CANCEL' }) } });
		expect(container.textContent).toContain('CANCELED');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/board/stop-row.svelte.test.js`
Expected: FAIL — the `ON TIME` assertion fails first (the word is still rendered), and every `data-testid` query returns null.

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `src/components/board/stop-row.svelte`:

```svelte
<script>
	import * as t from '$lib/paraglide/messages.js';

	const STATUS = {
		ONTIME: { glyph: '●', weight: 500 },
		EARLY: { glyph: '▲', weight: 700 },
		LATE: { glyph: '▼', weight: 700 },
		CANCEL: { glyph: '✕', weight: 700 },
		SCHED: { glyph: '○', weight: 500 }
	};

	// The glyph and the footer legend already carry "nothing is wrong"; spelling it out again
	// was a third encoding of one fact. Only deviations still say themselves in words.
	const SPELLED_OUT = new Set(['EARLY', 'LATE', 'CANCEL']);

	let { arrival, last = false, rowHeight = 64, numeralSize = 48 } = $props();

	const isCancel = $derived(arrival.status === 'CANCEL');
	const isNow = $derived(!isCancel && arrival.min <= 0);
	const s = $derived(STATUS[arrival.status] ?? STATUS.SCHED);
	const showPhrase = $derived(SPELLED_OUT.has(arrival.status));
	const phrase = $derived.by(() => {
		const { status, delta } = arrival;
		if (status === 'LATE' && delta != null) return t.board_status_min_late({ delta });
		if (status === 'EARLY' && delta != null)
			return t.board_status_min_early({ delta: Math.abs(delta) });
		if (status === 'EARLY') return t.board_status_early();
		if (status === 'LATE') return t.board_status_delayed();
		if (status === 'CANCEL') return t.board_status_canceled();
		return '';
	});

	// Word routes ("2 Line", "B Line") get a content-sized pill; a fixed 104px tile around
	// two small words reads as a black blob. Numeric routes keep the fixed tile.
	const route = $derived(String(arrival.route ?? ''));
	const isWordRoute = $derived(/[a-z]/i.test(route) && route.includes(' '));
	const badgeHeight = $derived(Math.max(48, Math.min(64, rowHeight - 22)));
	const badgeWidth = $derived(Math.round(badgeHeight * 1.9));
	const numericScale = $derived(
		route.length <= 2 ? 0.62 : route.length <= 3 ? 0.54 : route.length <= 4 ? 0.42 : 0.36
	);
	const badgeFontSize = $derived(
		isWordRoute
			? Math.min(26, Math.round(badgeHeight * 0.4))
			: Math.round(badgeHeight * numericScale)
	);

	// A single fixed, right-aligned column so every card's numerals form one vertical edge —
	// wide enough for NOW and three digits at the final size.
	const minutesColumn = $derived(Math.round(numeralSize * 2.6));
	const glyphSize = $derived(Math.round(numeralSize * 0.32));
	const minLabelSize = $derived(Math.round(numeralSize * 0.33));
	const cancelSize = $derived(Math.round(numeralSize * 0.54));
	// Destination sits clearly below the 36px card title but grows a little with the row.
	const destSize = $derived(Math.min(28, Math.round(24 + (numeralSize - 48) * 0.25)));
</script>

<div
	class="status-{arrival.status}"
	style:display="grid"
	style:grid-template-columns="auto minmax(0, 1fr) {minutesColumn}px"
	style:gap="14px"
	style:align-items="center"
	style:height="{rowHeight}px"
	style:border-bottom={last ? 'none' : '1px solid var(--rule)'}
	style:opacity={isCancel ? 0.7 : 1}
>
	<div
		class="route-badge"
		style:width={isWordRoute ? 'auto' : `${badgeWidth}px`}
		style:min-width={isWordRoute ? `${badgeHeight}px` : null}
		style:padding={isWordRoute ? '0 12px' : null}
		style:height="{badgeHeight}px"
		style:border-radius="var(--radius-chip)"
		style:display="grid"
		style:place-items="center"
	>
		<div
			class="display tnum"
			style:font-size="{badgeFontSize}px"
			style:font-weight="800"
			style:line-height="1"
			style:letter-spacing="-0.01em"
			style:color="var(--badge-ink)"
			style:white-space="nowrap"
		>
			{arrival.route}
		</div>
	</div>

	<div style:min-width="0">
		<div
			class="display"
			style:font-size="{destSize}px"
			style:font-weight="600"
			style:line-height="1.15"
			style:white-space="nowrap"
			style:overflow="hidden"
			style:text-overflow="ellipsis"
		>
			{arrival.dest || arrival.name}
		</div>
		{#if showPhrase}
			<div
				class="sc tnum"
				style:font-size="12px"
				style:letter-spacing="0.10em"
				style:margin-top="2px"
				style:color="var(--status-tone)"
				style:font-weight={s.weight}
			>
				{phrase}
			</div>
		{/if}
	</div>

	<div
		data-testid="minutes-group"
		dir="ltr"
		style:display="flex"
		style:align-items="baseline"
		style:gap="6px"
		style:justify-content="flex-end"
		style:overflow="hidden"
	>
		{#if !isNow}
			<span
				data-testid="status-glyph"
				aria-hidden="true"
				style:font-size="{glyphSize}px"
				style:color="var(--status-tone)"
				style:font-weight={s.weight}>{s.glyph}</span
			>
		{/if}
		{#if isCancel}
			<span
				data-testid="minutes"
				class="sc display"
				style:font-size="{cancelSize}px"
				style:font-weight="700"
				style:color="var(--status-tone)">{t.board_status_canceled()}</span
			>
		{:else if isNow}
			<span
				data-testid="minutes"
				class="sc display"
				style:font-size="{numeralSize}px"
				style:font-weight="800"
				style:line-height="0.9"
				style:letter-spacing="-0.01em"
				style:color="var(--accent)">{t.board_now()}</span
			>
		{:else}
			<span
				data-testid="minutes"
				class="display mono tnum"
				style:font-size="{numeralSize}px"
				style:font-weight="700"
				style:line-height="0.9"
				style:letter-spacing="-0.03em"
				style:color="var(--ink)">{arrival.min}</span
			>
			<span
				class="sc display"
				style:font-size="{minLabelSize}px"
				style:font-weight="700"
				style:letter-spacing="0.06em"
				style:color="var(--ink-mute)">{t.board_min()}</span
			>
		{/if}
	</div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/board/stop-row.svelte.test.js`
Expected: PASS, 13 tests.

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/components/board/stop-row.svelte src/components/board/stop-row.svelte.test.js
git commit -m "feat(board): rebuild departure row sizing, NOW emphasis and status de-duplication"
```

---

## Task 5: Stop card — §2 render, §6, §7, §12, §14, §17

The card gains the collapsed variant, the name/bay split, and the heading hierarchy. It also stops setting `grid-auto-rows` now that the row owns its height.

**Files:**
- Modify: `src/components/board/stop-card.svelte` (full rewrite)
- Test: `src/components/board/stop-card.svelte.test.js`

**Interfaces:**
- Consumes: `splitStopName()` from `$lib/formatters.js`, `COLLAPSED_CARD_HEIGHT` from `$lib/board-layout.js`, `StopRow` from Task 4.
- Produces: `<StopCard stop={Stop} limit={number} rowHeight={number} numeralSize={number} />`
  - `Stop` is `{ id, code, name, direction, arrivals, failed }`.
  - A card renders **collapsed** when `stop.failed` is true or it has no arrivals to show. Note that a failed stop can retain last-good arrivals (see `fetchAll()` in `+page.svelte`), but the existing card already gave `failed` precedence over those rows; that precedence is preserved deliberately rather than changed as a side effect of this work.

- [ ] **Step 1: Write the failing test**

Create `src/components/board/stop-card.svelte.test.js`:

```js
import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import StopCard from './stop-card.svelte';
import { COLLAPSED_CARD_HEIGHT } from '$lib/board-layout.js';

function arrival(overrides = {}) {
	return {
		route: '249',
		name: 'Route 249',
		dest: 'South Bellevue Station',
		min: 6,
		delta: 0,
		status: 'ONTIME',
		departureAt: Date.now() + 6 * 60000,
		tripId: `t-${Math.random()}`,
		...overrides
	};
}

function stop(overrides = {}) {
	return {
		id: '1_74443',
		code: '74443',
		name: '120th Ave NE & NE Spring Blvd - Bay 1',
		direction: 'N',
		arrivals: [arrival()],
		failed: false,
		...overrides
	};
}

describe('StopCard heading', () => {
	afterEach(() => cleanup());

	// Punch list §7: the bay belongs in the meta line, not the title.
	test('strips the bay from the title and folds it into the meta line', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		const title = container.querySelector('[data-testid="stop-title"]');
		const meta = container.querySelector('[data-testid="stop-meta"]');
		expect(title.textContent.trim()).toBe('120th Ave NE & NE Spring Blvd');
		expect(title.textContent).not.toContain('Bay');
		expect(meta.textContent).toContain('#74443');
		expect(meta.textContent).toContain('Bay 1');
		expect(meta.textContent).toContain('Northbound');
	});

	test('omits the bay separator when the stop has no bay', () => {
		const { container } = render(StopCard, {
			props: { stop: stop({ name: 'Pine St & 3rd Ave' }) }
		});
		const meta = container.querySelector('[data-testid="stop-meta"]');
		expect(meta.textContent).not.toContain('Bay');
		expect(meta.textContent).toContain('#74443');
		expect(meta.textContent).toContain('Northbound');
	});

	// Punch list §6: the title must clearly outrank its own rows (36px vs the row's 24px).
	test('sets the title well above the destination size', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		expect(container.querySelector('[data-testid="stop-title"]').style.fontSize).toBe('36px');
	});

	// Punch list §17: 0.18em at 13px turns the meta line into texture.
	test('sets meta tracking to 0.10em', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		expect(container.querySelector('[data-testid="stop-meta"]').style.letterSpacing).toBe('0.10em');
	});
});

describe('StopCard collapsed variant', () => {
	afterEach(() => cleanup());

	// Punch list §2: an empty stop must not occupy a full card in a prime position.
	test('collapses an empty stop to a single dim line with no fill', () => {
		const { container } = render(StopCard, { props: { stop: stop({ arrivals: [] }) } });
		const card = container.querySelector('section');
		expect(card.style.height).toBe(`${COLLAPSED_CARD_HEIGHT}px`);
		expect(card.style.background).toBe('transparent');
		expect(card.style.opacity).toBe('0.4');
		expect(card.textContent).toContain('120th Ave NE & NE Spring Blvd');
		expect(card.textContent).toContain('Bay 1');
		expect(card.textContent).toContain('Northbound');
		expect(card.textContent).toContain('No upcoming departures');
	});

	test('drops the letterspaced caps treatment on the collapsed line', () => {
		const { container } = render(StopCard, { props: { stop: stop({ arrivals: [] }) } });
		expect(container.querySelector('section').textContent).not.toContain(
			'NO UPCOMING DEPARTURES'
		);
	});

	test('collapses a failed stop but keeps it at full presence in the late tone', () => {
		const { container } = render(StopCard, {
			props: { stop: stop({ arrivals: [], failed: true }) }
		});
		const card = container.querySelector('section');
		expect(card.style.opacity).toBe('1');
		expect(card.textContent).toContain('DATA UNAVAILABLE');
	});

	test('gives a stop with departures a full card, not the collapsed line', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		const card = container.querySelector('section');
		expect(card.style.height).toBe('');
		expect(card.style.background).toBe('var(--bg-elev)');
		expect(card.querySelectorAll('.route-badge').length).toBe(1);
	});
});

describe('StopCard sizing', () => {
	afterEach(() => cleanup());

	test('passes the solver sizes down to its rows and caps them at the limit', () => {
		const arrivals = Array.from({ length: 5 }, () => arrival());
		const { container } = render(StopCard, {
			props: { stop: stop({ arrivals }), limit: 3, rowHeight: 88, numeralSize: 60 }
		});
		const rows = container.querySelectorAll('.route-badge');
		expect(rows.length).toBe(3);
		expect(container.querySelector('[data-testid="minutes"]').style.fontSize).toBe('60px');
	});

	test('uses the container radius and the card edge token', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		const card = container.querySelector('section');
		expect(card.style.borderRadius).toBe('var(--radius-container)');
		expect(card.style.border).toBe('1px solid var(--card-edge)');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/board/stop-card.svelte.test.js`
Expected: FAIL — the title still contains `- Bay 1` and every `data-testid` query returns null.

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `src/components/board/stop-card.svelte`:

```svelte
<script>
	import * as t from '$lib/paraglide/messages.js';
	import { splitStopName } from '$lib/formatters.js';
	import { COLLAPSED_CARD_HEIGHT } from '$lib/board-layout.js';
	import StopRow from '$components/board/stop-row.svelte';

	let { stop, limit = 4, rowHeight = 64, numeralSize = 48 } = $props();

	const rows = $derived(stop.failed ? [] : stop.arrivals.slice(0, limit));
	// A failed stop can still hold last-good arrivals, but the card has always given the
	// failure precedence over them; that behaviour is preserved here.
	const collapsed = $derived(stop.failed || rows.length === 0);

	const title = $derived(splitStopName(stop.name));
	const direction = $derived.by(() => {
		const key = `board_dir_${String(stop.direction ?? '').toUpperCase()}`;
		return key in t ? t[key]() : '';
	});

	const meta = $derived(
		[t.board_stop_code({ stopId: stop.code }), title.bay, direction].filter(Boolean)
	);
	const collapsedLabel = $derived([title.name, title.bay, direction].filter(Boolean).join(' · '));
	const collapsedMessage = $derived(
		stop.failed ? t.board_data_unavailable() : t.board_no_departures_inline()
	);
</script>

{#if collapsed}
	<!-- One line on the cream ground: still present so a rider knows the stop is watched,
	     but never taking a full card in a prime position. -->
	<section
		style:display="flex"
		style:align-items="center"
		style:align-self="start"
		style:min-width="0"
		style:height="{COLLAPSED_CARD_HEIGHT}px"
		style:padding="0 20px"
		style:background="transparent"
		style:border="1px solid var(--card-edge)"
		style:border-radius="var(--radius-container)"
		style:opacity={stop.failed ? 1 : 0.4}
	>
		<span
			class="display"
			style:font-size="22px"
			style:font-weight="600"
			style:white-space="nowrap"
			style:overflow="hidden"
			style:text-overflow="ellipsis"
			style:color={stop.failed ? 'var(--late)' : 'var(--ink)'}
		>
			{collapsedLabel} — {collapsedMessage}
		</span>
	</section>
{:else}
	<section
		style:display="grid"
		style:grid-template-rows="auto auto"
		style:align-self="start"
		style:min-height="0"
		style:background="var(--bg-elev)"
		style:border="1px solid var(--card-edge)"
		style:border-radius="var(--radius-container)"
		style:padding="16px 20px 10px"
	>
		<div style:padding-bottom="10px" style:border-bottom="1px solid var(--rule)">
			<div
				data-testid="stop-title"
				class="display"
				style:font-size="36px"
				style:font-weight="700"
				style:line-height="1.12"
				style:white-space="nowrap"
				style:overflow="hidden"
				style:text-overflow="ellipsis"
			>
				{title.name}
			</div>
			<div
				data-testid="stop-meta"
				class="sc tnum"
				style:font-size="13px"
				style:letter-spacing="0.10em"
				style:color="var(--ink-mute)"
				style:margin-top="6px"
				style:white-space="nowrap"
				style:overflow="hidden"
				style:text-overflow="ellipsis"
			>
				{#each meta as part, i (part)}{#if i > 0}<span
							style:margin="0 8px"
							style:color="var(--rule-strong)">·</span
						>{/if}{part}{/each}
			</div>
		</div>

		<div style:display="grid" style:min-height="0">
			{#each rows as arrival, i (arrival.tripId ?? `${arrival.route}-${arrival.departureAt}`)}
				<StopRow {arrival} {rowHeight} {numeralSize} last={i === rows.length - 1} />
			{/each}
		</div>
	</section>
{/if}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/board/stop-card.svelte.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/components/board/stop-card.svelte src/components/board/stop-card.svelte.test.js
git commit -m "feat(board): split bay into meta, raise title, collapse empty stops"
```

---

## Task 6: Multi-stop board — §1, §2 sort, §16, §18, §19

Wire the solver in, sort empty stops to the back, draw the column spine, and fix the header lockup. This task also pins the board's row template to the exact constants the solver assumes, so the arithmetic in Task 1 cannot drift away from the markup.

**Files:**
- Modify: `src/components/board/multi-stop-board.svelte`
- Modify: `src/components/board/multi-stop-board.svelte.test.js`

**Interfaces:**
- Consumes: `computeGridLayout`, `HEADER_HEIGHT`, `ALERT_HEIGHT`, `FOOTER_HEIGHT`, `SECTION_GAP`, `CARD_GAP` from `$lib/board-layout.js`; `StopCard` from Task 5.
- Produces: no new public props. The board's existing props are unchanged.

**Note on §19:** verify only, no change. The header is already `grid-template-columns: auto 1fr auto` with `DEPARTURES` centered inside the `1fr` track, which by definition is the span between the logo lockup's right edge and the clock's left edge — exactly what §19 asks for. Confirm visually in Task 9 and leave the markup alone.

**Note on §18:** the divider and the 24px gap are built here. The "restore the operator caps line" half of §18 is **not** built: branding exposes only `logoUrl` and `regionName` (`src/lib/config/branding.js:40-44`), so there is no second operator string to render. It needs a new branding field and is out of scope for this plan.

- [ ] **Step 1: Write the failing test**

Add to `src/components/board/multi-stop-board.svelte.test.js`, inside the existing `describe('MultiStopBoard', ...)` block:

```js
	// Punch list §2: the two most valuable positions on the board must not go to empty stops.
	test('sorts stops with departures ahead of empty and failed ones', () => {
		const live = arrival();
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [
					stop('1_empty'),
					stop('1_live', [live]),
					stop('1_failed', [], { failed: true }),
					stop('1_live2', [live])
				],
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		const cards = [...container.querySelectorAll('section')];
		const withRows = cards.map((c) => c.querySelectorAll('.route-badge').length > 0);
		expect(withRows).toEqual([true, true, false, false]);
	});

	test('preserves the configured order within the group that has departures', () => {
		const live = arrival();
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_100', [live]), stop('1_200'), stop('1_300', [live])],
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		const titles = [...container.querySelectorAll('[data-testid="stop-title"]')];
		expect(titles.map((el) => el.textContent.trim())).toEqual(['Stop 1_100', 'Stop 1_300']);
	});

	// Punch list §1: leftover panel height becomes bigger type, not a dead zone.
	test('grows rows above the 64px floor when the board is sparse', () => {
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_1', [arrival()]), stop('1_2', [arrival()])],
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		const row = container.querySelector('.route-badge').closest('[class^="status-"]');
		expect(parseInt(row.style.height, 10)).toBeGreaterThan(64);
	});

	// Punch list §16: a spine between the columns so unequal card heights do not drift apart.
	test('draws one column rule per gap', () => {
		const many = Array.from({ length: 4 }, () => arrival());
		const two = render(MultiStopBoard, {
			props: { stops: [stop('1_1', many), stop('1_2', many)], now, lastUpdatedAt: now.getTime() }
		});
		expect(two.container.querySelectorAll('[data-testid="column-rule"]').length).toBe(1);
		cleanup();
		const five = render(MultiStopBoard, {
			props: {
				stops: Array.from({ length: 5 }, (_, i) => stop(`1_${i}`, many)),
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		expect(five.container.querySelectorAll('[data-testid="column-rule"]').length).toBe(2);
	});

	// Punch list §18: the mark and the wordmark were butted together with no separator.
	test('separates the logo from the agency name with a divider', () => {
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_1')],
				now,
				lastUpdatedAt: now.getTime(),
				agencyName: 'The Briar',
				agencyLogo: 'https://example.test/mark.svg'
			}
		});
		expect(container.querySelector('[data-testid="lockup-divider"]')).not.toBeNull();
	});

	test('omits the divider when there is no logo', () => {
		const { container } = render(MultiStopBoard, {
			props: { stops: [stop('1_1')], now, lastUpdatedAt: now.getTime(), agencyName: 'The Briar' }
		});
		expect(container.querySelector('[data-testid="lockup-divider"]')).toBeNull();
	});
```

Then update the two existing assertions the earlier tasks invalidated:

```js
	// was: expect(container.innerHTML).toContain('STOP #100');
	expect(container.innerHTML).toContain('#100');
```

```js
	// was: expect(container.innerHTML).toContain('NO UPCOMING DEPARTURES');
	// §2 replaced the centred caps block with a sentence-case collapsed line.
	expect(container.innerHTML).toContain('No upcoming departures');
	expect(container.innerHTML).toContain('DATA UNAVAILABLE');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/board/multi-stop-board.svelte.test.js`
Expected: FAIL — no `[data-testid="column-rule"]` or `[data-testid="lockup-divider"]` elements, and the sort assertions come back in the original order.

- [ ] **Step 3: Update the script block**

In `src/components/board/multi-stop-board.svelte`, add the solver import below the existing imports:

```js
	import {
		ALERT_HEIGHT,
		CARD_GAP,
		FOOTER_HEIGHT,
		HEADER_HEIGHT,
		SECTION_GAP,
		computeGridLayout
	} from '$lib/board-layout.js';
```

Replace the grid-shape block (currently lines 25-32, the comment plus `n`, `cols`, `gridRows`, `perCard`, `rowHeight`) with:

```js
	// Stops with departures come first; an empty or failed stop collapses to one line at the
	// back rather than taking a prime position at full card height.
	const isEmpty = (s) => s.failed || s.arrivals.length === 0;
	// Array.prototype.sort is stable, so the configured order survives inside each group.
	const ordered = $derived([...stops].sort((a, b) => Number(isEmpty(a)) - Number(isEmpty(b))));
	const rowCounts = $derived(ordered.map((s) => (s.failed ? 0 : s.arrivals.length)));
```

Then add, after the existing `hasAlert` derivation (which the solver depends on):

```js
	// Every dimension of the 1920×1080 stage is known, so the grid is solved rather than
	// measured: leftover height is spent on row height and numeral size (punch list §1).
	const layout = $derived(
		computeGridLayout({ rowCounts, maxDepartures, hasAlert, showFooter })
	);
	const templateRows = $derived(
		[
			`${HEADER_HEIGHT}px`,
			'1fr',
			hasAlert ? `${ALERT_HEIGHT}px` : null,
			showFooter ? `${FOOTER_HEIGHT}px` : null
		]
			.filter(Boolean)
			.join(' ')
	);
	// A 1px rule at each gap's midpoint. The track expression mirrors the grid's own sizing so
	// the rule lands exactly between columns at both 2 and 3 columns.
	const ruleOffsets = $derived(
		Array.from({ length: layout.cols - 1 }, (_, i) => {
			const track = `(100% - ${(layout.cols - 1) * CARD_GAP}px) / ${layout.cols}`;
			return `calc(${i + 1} * ${track} + ${i * CARD_GAP + CARD_GAP / 2}px - 0.5px)`;
		})
	);
```

- [ ] **Step 4: Update the markup**

Change the outer container's `grid-template-rows` and `gap` (currently lines 60-61) to use the constants:

```svelte
	style:grid-template-rows={templateRows}
	style:gap="{SECTION_GAP}px"
```

Add the lockup divider inside the header's first block, and widen the gap from `16px` to `24px`:

```svelte
		<div style:display="flex" style:align-items="center" style:gap="24px">
			{#if agencyLogo}
				<img
					src={agencyLogo}
					alt={agencyName}
					style:height="58px"
					style:width="auto"
					style:object-fit="contain"
				/>
			{/if}
			{#if agencyLogo && agencyName}
				<div
					data-testid="lockup-divider"
					aria-hidden="true"
					style:width="1px"
					style:height="44px"
					style:background="var(--rule)"
				></div>
			{/if}
			{#if agencyName}
				<div
					class="display"
					style:display="flex"
					style:align-items="center"
					style:font-size="30px"
					style:font-weight="700"
					style:line-height="1.05"
				>
					{agencyName}
				</div>
			{/if}
		</div>
```

Replace the whole STOP GRID block with:

```svelte
	<!-- STOP GRID -->
	<div
		style:position="relative"
		style:display="grid"
		style:grid-template-columns="repeat({layout.cols}, 1fr)"
		style:grid-auto-rows="min-content"
		style:align-content="center"
		style:gap="{CARD_GAP}px"
		style:min-height="0"
	>
		{#each ruleOffsets as left, i (i)}
			<div
				data-testid="column-rule"
				aria-hidden="true"
				style:position="absolute"
				style:top="0"
				style:bottom="0"
				style:left
				style:width="1px"
				style:background="var(--rule)"
			></div>
		{/each}
		{#each ordered as stop (stop.id)}
			<StopCard
				{stop}
				limit={layout.perCard}
				rowHeight={layout.rowHeight}
				numeralSize={layout.numeralSize}
			/>
		{/each}
	</div>
```

Give the footer the height the solver reserves for it:

```svelte
		<footer
			style:display="grid"
			style:grid-template-columns="auto 1fr auto"
			style:align-items="center"
			style:gap="32px"
			style:height="{FOOTER_HEIGHT}px"
			style:border-top="1px solid var(--rule)"
			style:padding-top="12px"
		>
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/components/board/multi-stop-board.svelte.test.js`
Expected: PASS. If `renders the alert band when an alert is present` fails on `.alert-alert`, leave it — Task 8 owns that assertion.

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS except any alert-band assertion, which Task 8 fixes.

- [ ] **Step 7: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/components/board/multi-stop-board.svelte src/components/board/multi-stop-board.svelte.test.js
git commit -m "feat(board): solve grid height, sort empty stops last, add column spine"
```

---

## Task 7: Clock — §4

`7:52 :47 PM` reads as three numbers because the meridiem lands after the seconds. The footer already carries a to-the-second timestamp, so the hero clock drops seconds entirely.

**Files:**
- Modify: `src/components/board/clock-block.svelte`
- Test: `src/components/board/clock-block.svelte.test.js`

**Interfaces:**
- Consumes: `formatDate()` from `$lib/formatters.js`, `getLocale()` from `$lib/paraglide/runtime.js`.
- Produces: `<ClockBlock now={Date} />` — unchanged prop surface.

- [ ] **Step 1: Write the failing test**

Create `src/components/board/clock-block.svelte.test.js`:

```js
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
		expect(separator.style.margin).toBe('0 -0.04em');
	});

	test('renders the same string one second later', () => {
		const a = render(ClockBlock, { props: { now } });
		const first = a.container.querySelector('[data-testid="clock"]').textContent;
		cleanup();
		const b = render(ClockBlock, { props: { now: new Date(2026, 7, 25, 19, 52, 48) } });
		expect(b.container.querySelector('[data-testid="clock"]').textContent).toBe(first);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/board/clock-block.svelte.test.js`
Expected: FAIL — the clock still contains `47`, and there is no `[data-testid="clock"]`.

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `src/components/board/clock-block.svelte`:

```svelte
<script>
	import { formatDate } from '$lib/formatters.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let { now } = $props();

	const dateText = $derived(formatDate(now));

	// Force Latin numerals via Unicode extension (ar-u-nu-latn) and keep the numeric group
	// (hour, separator, minute) LTR while the meridiem stays locale-ordered. Seconds are gone:
	// the footer already reports the update time to the second, and the meridiem landing after
	// a ticking seconds group made the clock parse as three unrelated numbers.
	const timeParts = $derived.by(() => {
		const latinLocale = `${getLocale()}-u-nu-latn`;
		const parts = new Intl.DateTimeFormat(latinLocale, {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).formatToParts(now);
		return {
			hour: parts.find((p) => p.type === 'hour')?.value ?? '',
			separator: parts.find((p) => p.type === 'literal')?.value ?? ':',
			minute: parts.find((p) => p.type === 'minute')?.value ?? '',
			meridiem: parts.find((p) => p.type === 'dayPeriod')?.value ?? ''
		};
	});

	const isRTL = $derived(getLocale() === 'ar');
</script>

<div style:text-align="right">
	<div
		class="sc"
		style:font-size="18px"
		style:letter-spacing="0.22em"
		style:color="var(--ink-mute)"
		style:margin-bottom="4px"
	>
		{dateText}
	</div>
	<div
		data-testid="clock"
		class="mono display tnum"
		style:font-size="52px"
		style:font-weight="600"
		style:line-height="1"
		style:letter-spacing="-0.02em"
		style:color="var(--accent)"
		style:white-space="nowrap"
		style:display="flex"
		style:align-items="baseline"
		style:justify-content="flex-end"
		style:gap="8px"
	>
		{#if isRTL && timeParts.meridiem}
			<span style:color="var(--ink-dim)" style:font-weight="400" style:font-size="28px"
				>{timeParts.meridiem}</span
			>
		{/if}
		<span dir="ltr"
			>{timeParts.hour}<span
				data-testid="clock-separator"
				style:margin="0 -0.04em"
				style:display="inline-block">{timeParts.separator}</span
			>{timeParts.minute}</span
		>
		{#if !isRTL && timeParts.meridiem}
			<span style:color="var(--ink-dim)" style:font-weight="400" style:font-size="28px"
				>{timeParts.meridiem}</span
			>
		{/if}
	</div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/board/clock-block.svelte.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/components/board/clock-block.svelte src/components/board/clock-block.svelte.test.js
git commit -m "fix(board): drop seconds from the hero clock and kern the colon"
```

---

## Task 8: Alert band — §5, §12

The band truncates its headline mid-word, never renders the body, stacks two caps lines in the right rail, and draws no severity bar. The last of those is not a styling bug: `app.css` defines `.alert-advisory / .alert-info / .alert-alert`, but the component builds the class from OBA's raw severity string, whose vocabulary (`noImpact`, `verySlight`, `slight`, `normal`, `severe`, `verySevere`, `unknown`) matches none of them — so `--alert-tone` was never set and both the bar and the tint silently did not render. `alertTone()` from Task 2 fixes it.

**Files:**
- Modify: `src/components/board/alert-band.svelte`
- Test: `src/components/board/alert-band.svelte.test.js`

**Interfaces:**
- Consumes: `formatAlertWindow()` and `alertTone()` from `$lib/formatters.js` (Task 2), `ALERT_HEIGHT` from `$lib/board-layout.js` (Task 1), `translate()` and `t` as before.
- Produces: `<AlertBand situation={Situation} />` — unchanged prop surface. The band is now a fixed `ALERT_HEIGHT` tall, which is what the solver reserves for it.

- [ ] **Step 1: Write the failing test**

Create `src/components/board/alert-band.svelte.test.js`:

```js
import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import AlertBand from './alert-band.svelte';
import { ALERT_HEIGHT } from '$lib/board-layout.js';

const HEADLINE =
	'Starting Monday, several routes serving downtown will have changes ranging from minor stop relocations to full reroutes';
const BODY = 'Check the agency website for the full list of affected trips.';

function situation(overrides = {}) {
	return {
		summary: { value: HEADLINE },
		description: { value: BODY },
		severity: 'severe',
		activeWindows: [
			{
				from: new Date('2026-08-18T12:00:00Z').getTime(),
				to: new Date('2026-09-05T12:00:00Z').getTime()
			}
		],
		...overrides
	};
}

describe('AlertBand content', () => {
	afterEach(() => cleanup());

	// Punch list §5: the headline was single-line clipped and the body never rendered.
	test('clamps the headline to two lines rather than one', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		const headline = container.querySelector('[data-testid="alert-headline"]');
		expect(headline.textContent).toContain('ranging from');
		expect(headline.style.webkitLineClamp || headline.style.getPropertyValue('-webkit-line-clamp')).toBe('2');
	});

	test('renders the body below the headline', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		const body = container.querySelector('[data-testid="alert-body"]');
		expect(body).not.toBeNull();
		expect(body.textContent).toContain('affected trips');
	});

	test('omits the body element when the situation has no description', () => {
		const { container } = render(AlertBand, {
			props: { situation: situation({ description: undefined }) }
		});
		expect(container.querySelector('[data-testid="alert-body"]')).toBeNull();
	});

	// Punch list §5: SERVICE ADVISORY becomes a left-aligned eyebrow above the headline.
	test('places SERVICE ADVISORY above the headline as an eyebrow, not in the right rail', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		const eyebrow = container.querySelector('[data-testid="alert-eyebrow"]');
		const rail = container.querySelector('[data-testid="alert-window"]');
		expect(eyebrow.textContent).toContain('SERVICE ADVISORY');
		expect(rail.textContent).not.toContain('SERVICE ADVISORY');
	});

	// Punch list §5: the header already says the year and today's date.
	test('shows the date window without weekday or year', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		const rail = container.querySelector('[data-testid="alert-window"]').textContent;
		expect(rail).toContain('Aug 18');
		expect(rail).toContain('Sep 5');
		expect(rail).not.toMatch(/2026/);
		expect(rail).not.toMatch(/Tue|Sat/i);
	});

	test('renders nothing in the rail when the situation has no active window', () => {
		const { container } = render(AlertBand, {
			props: { situation: situation({ activeWindows: [] }) }
		});
		expect(container.querySelector('[data-testid="alert-window"]').textContent.trim()).toBe('');
	});
});

describe('AlertBand severity', () => {
	afterEach(() => cleanup());

	// Regression: OBA severity values never matched the three tone classes, so the 6px
	// severity bar and the background tint never drew on the deployed board.
	test('maps an OBA severity onto a tone class the stylesheet defines', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		expect(container.querySelector('.alert-alert')).not.toBeNull();
	});

	test('maps a low severity to the info tone', () => {
		const { container } = render(AlertBand, {
			props: { situation: situation({ severity: 'slight' }) }
		});
		expect(container.querySelector('.alert-info')).not.toBeNull();
	});

	test('always lands on a defined tone for an unknown severity', () => {
		const { container } = render(AlertBand, {
			props: { situation: situation({ severity: 'somethingNew' }) }
		});
		expect(container.querySelector('.alert-advisory')).not.toBeNull();
	});
});

describe('AlertBand geometry', () => {
	afterEach(() => cleanup());

	test('is exactly the height the layout solver reserves for it', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		expect(container.firstElementChild.style.height).toBe(`${ALERT_HEIGHT}px`);
	});

	test('uses the container radius on the band and the chip radius on the glyph box', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		expect(container.firstElementChild.style.borderRadius).toBe('var(--radius-container)');
		expect(container.querySelector('.alert-glyph').style.borderRadius).toBe('var(--radius-chip)');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/board/alert-band.svelte.test.js`
Expected: FAIL — no `[data-testid="alert-eyebrow"]`, and `.alert-alert` is null because `severity: 'severe'` currently produces the class `alert-severe`.

- [ ] **Step 3: Rewrite the markup**

In `src/components/board/alert-band.svelte`, extend the imports:

```js
	import { ALERT_HEIGHT } from '$lib/board-layout.js';
	import { alertTone, formatAlertWindow, translate } from '$lib/formatters.js';
```

(`formatTimestamp` is no longer used here — drop it from the import.)

Replace the `severity` and window derivations:

```js
	const activeWindow = $derived(situation?.activeWindows?.[0]);
	const windowStart = $derived(activeWindow?.from ? formatAlertWindow(activeWindow.from) : '');
	const windowEnd = $derived(activeWindow?.to ? formatAlertWindow(activeWindow.to) : '');
	// OBA's severity vocabulary does not match the three tones app.css paints; without this
	// mapping the class matched no rule and the severity bar never drew.
	const tone = $derived(alertTone(situation?.severity));
```

Replace the entire markup block (everything from `<div class="alert-badge ...">` to the end of the file):

```svelte
<div
	class="alert-badge alert-{tone}"
	style:display="grid"
	style:grid-template-columns="auto 1fr auto"
	style:gap="22px"
	style:align-items="center"
	style:height="{ALERT_HEIGHT}px"
	style:padding="10px 20px"
	style:border-radius="var(--radius-container)"
>
	<div
		class="alert-glyph"
		style:width="44px"
		style:height="44px"
		style:display="grid"
		style:place-items="center"
		style:border="2px solid currentColor"
		style:border-radius="var(--radius-chip)"
	>
		<span style:font-size="26px" style:font-weight="800" style:line-height="1">!</span>
	</div>

	<div
		style:min-width="0"
		style:direction={isRTL ? 'rtl' : 'ltr'}
		style:text-align={isRTL ? 'right' : 'left'}
	>
		<div
			data-testid="alert-eyebrow"
			class="sc"
			style:font-size="12px"
			style:letter-spacing="0.10em"
			style:color="var(--ink-mute)"
			style:margin-bottom="4px"
		>
			{t.board_service_advisory()}
		</div>
		<div
			data-testid="alert-headline"
			style:font-size="24px"
			style:font-weight="600"
			style:line-height="1.2"
			style:color="var(--ink)"
			style:display="-webkit-box"
			style:-webkit-line-clamp="2"
			style:-webkit-box-orient="vertical"
			style:overflow="hidden"
		>
			{headline}
		</div>
		{#if body}
			<div
				data-testid="alert-body"
				style:font-size="18px"
				style:line-height="1.25"
				style:color="var(--ink-dim)"
				style:margin-top="3px"
				style:display="-webkit-box"
				style:-webkit-line-clamp="1"
				style:-webkit-box-orient="vertical"
				style:overflow="hidden"
			>
				{body}
			</div>
		{/if}
	</div>

	<div
		data-testid="alert-window"
		class="sc"
		style:font-size="13px"
		style:letter-spacing="0.10em"
		style:color="var(--ink-mute)"
		style:text-align="right"
		style:white-space="nowrap"
	>
		{#if windowStart}{windowStart}{#if windowEnd}
				{isRTL ? '←' : '→'} {windowEnd}{/if}{/if}
	</div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/board/alert-band.svelte.test.js`
Expected: PASS, 11 tests.

If the two `-webkit-line-clamp` assertions fail because jsdom drops the vendor-prefixed property from `element.style`, replace the Svelte `style:` directives for the three clamp properties with a single `style` attribute string on those elements — jsdom preserves the raw attribute:

```svelte
			style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;"
```

and change the assertion to read the attribute:

```js
		expect(headline.getAttribute('style')).toContain('-webkit-line-clamp:2');
```

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS, including `renders the alert band when an alert is present` in `multi-stop-board.svelte.test.js` — that test passes `severity: 'alert'`, which `alertTone()` passes straight through.

- [ ] **Step 6: Format, lint, commit**

```bash
npm run format
npm run lint
git add src/components/board/alert-band.svelte src/components/board/alert-band.svelte.test.js
git commit -m "fix(board): restore alert severity tone, headline body and date window"
```

---

## Task 9: Whole-board verification

Unit tests pin behaviour but not composition. This task looks at the real board at real size, in both themes and both color modes, and walks the punch list.

**Files:**
- Modify: any of the above, only if a defect is found.

**Interfaces:**
- Consumes: everything from Tasks 1-8.
- Produces: no code. A pass/fail walk of the 19 items.

- [ ] **Step 1: Run the full suite and the type check**

```bash
npm test
npm run check
npm run lint
```
Expected: all pass. `npm run check` must report no new errors versus `main`.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```
Open `http://localhost:5173/stops/<stopA>+<stopB>+<stopC>+<stopD>` using four real stop IDs from the configured OBA region, in a viewport of exactly 1920×1080 so `fitStage()` renders at scale 1.

- [ ] **Step 3: Walk the P0 items**

- [ ] §1 — no dead zone. The last card's bottom edge sits within ~20px of the alert band. Rows are visibly taller than the old 64px and numerals larger than 48px.
- [ ] §2 — any stop with no departures is in the *last* position and is a single dim line on the cream ground, not a white card. Its text is sentence case, not letterspaced caps.
- [ ] §3 — the minute numeral is the same ink on every row regardless of status. Only the glyph, the status word and `NOW` change color.
- [ ] §4 — the clock reads `7:52 PM`, one meridiem, no seconds, and does not change width as the minute rolls over.
- [ ] §5 — the alert headline runs to two lines, the body renders beneath it, `SERVICE ADVISORY` is an eyebrow above the headline, the right rail shows only `Aug 18 → Sep 5`, and a colored 6px bar is visible on the left edge.

- [ ] **Step 4: Walk the P1 and P2 items**

- [ ] §6 — the card title clearly outranks the destination.
- [ ] §7 — no `- Bay N` in any title; the meta line reads `#74443 · Bay 1 · Northbound`.
- [ ] §8 — every card's minute numerals form one vertical edge with clear space to the card border.
- [ ] §9 — `NOW` is the loudest element in its card, with no hollow glyph beside it.
- [ ] §10 — glyph and numeral share a baseline; the destination block is centered in its row.
- [ ] §11 — the glyph reads as part of the number, at a consistent size across rows.
- [ ] §12 — cards and the alert band share one radius; route tiles and the alert glyph box share the other.
- [ ] §13 — `2 Line` sits in a content-sized pill, not a wide blob; tile text is cream, not amber.
- [ ] §14 — cards are clearly separated from the ground, with no blur or soft shadow.
- [ ] §15 — no row says `ON TIME` or `SCHEDULED`; deviations still say themselves; the footer legend is intact.
- [ ] §16 — a 1px rule runs between the columns.
- [ ] §17 — meta lines read as words, not texture.
- [ ] §18 — a divider separates the mark from the agency name. (The operator caps line is deliberately not built — see Task 6.)
- [ ] §19 — `DEPARTURES` sits at the optical midpoint between the lockup and the clock. Expected to be already correct; if it is not, the header's `auto 1fr auto` template is doing something unexpected and needs investigating rather than nudging.

- [ ] **Step 5: Check the other three renderings**

- [ ] Set `theme: "dark"` in `src/lib/config/settings.json` and reload. Cards, tiles, tones and the new `--card-edge` all read correctly.
- [ ] Set `colorMode: "mono"` with `theme: "light"`. Every status tone collapses to ink; `NOW` still reads loudest via its 800 weight; the route tile is ink with paper-colored text.
- [ ] Set `colorMode: "mono"` with `theme: "dark"`. Same check.
- [ ] Restore `settings.json` to `theme: "system"`, `colorMode: "color"`.

- [ ] **Step 6: Check the counts the solver has to survive**

Load 2, 3, 5 and 6 stop URLs. For each: nothing overflows the 1080px stage, no card is clipped, and the last card's bottom stays above the alert band.

- [ ] **Step 7: Check the single-stop board did not regress**

Load a single-stop URL. `board.svelte` and `departure-row.svelte` were not modified, but they share `--badge-ink`, `--card-edge` and the radius tokens. Confirm the single-stop board still reads correctly in light and dark.

- [ ] **Step 8: Commit any fixes and finish**

```bash
npm run format
npm run lint
npm test
git add -A
git commit -m "fix(board): address defects found in whole-board verification"
```

---

## Self-Review

**Spec coverage.** All 19 items map to a task: §1 → Tasks 1, 6. §2 → Tasks 1, 2, 5, 6. §3 → Tasks 3, 4 (and already-built `colorMode`, per spec correction 1). §4 → Task 7. §5 → Tasks 2, 8. §6, §7 → Tasks 2, 5. §8, §9, §10, §11 → Task 4. §12 → Tasks 3, 4, 5, 8. §13 → Tasks 3, 4. §14 → Tasks 3, 5. §15 → Task 4. §16 → Task 6. §17 → Task 5. §18 → Task 6 (partial, documented). §19 → Task 6 (verify-only, documented). Two items are deliberately not fully built and say so in place: §18's operator caps line (no branding field exists) and §19 (already correct).

**Type consistency.** `computeGridLayout` returns `{cols, gridRows, perCard, rowHeight, numeralSize}` in Task 1 and is destructured with exactly those names in Task 6. `rowHeight` and `numeralSize` are the prop names in Tasks 4, 5 and 6. `splitStopName` returns `{name, bay}` in Task 2 and is read as `title.name` / `title.bay` in Task 5. `alertTone` returns `'info' | 'advisory' | 'alert'`, which are exactly the three suffixes `app.css:162-170` defines. `COLLAPSED_CARD_HEIGHT` and `ALERT_HEIGHT` are imported into components in Tasks 5 and 8 from the module that defines them in Task 1.

**Constants that must agree.** `CARD_CHROME_HEIGHT = 102` in `board-layout.js` is the sum of the card chrome built in Task 5 (16 + 41 + 6 + 16 + 10 + 1 + 10 + 2). `ALERT_HEIGHT` and `FOOTER_HEIGHT` are enforced as literal heights on the elements in Tasks 8 and 6 respectively, so the solver's arithmetic cannot drift from the markup. If any of those change, `board-layout.test.js` will catch the overflow via its `usedHeight()` helper.

**Known residual.** When a board is very sparse (say two stops with one departure each), the solver hits `MAX_ROW_HEIGHT` and some slack remains. `align-content: center` on the stop grid splits that slack above and below the cards so it reads as deliberate margin rather than a dead zone at the bottom. Raising `MAX_ROW_HEIGHT` past 96 would close it further at the cost of the 6-stop case; that ceiling is the punch list's own number and is left alone.
