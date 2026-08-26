# Waystation — UI Polish Punch List

Comparing the deployed board (`waystation.bridge.onebusawaycloud.com`, light theme, 4 stops, screenshot 8/25 7:52 PM) against `Waystation.html` + `Multi-Stop Board - Design Notes.md`.

The bones are right: one card per stop, glyph + word + number status, cream/white paper palette. What's costing it visual authority is (1) half the board is empty, (2) the light theme's color rules got half-applied, and (3) a handful of small alignment/truncation defects that read as sloppiness at kiosk distance.

---

## P0 — Fixes that change how the board reads

### 1. Kill the dead zone below the cards
~35% of the board is empty between the last card and the alert band, while rows sit at their minimum 64px height. "Cards hug their content" was the right rule for *card height relative to each other*; it was never meant to leave a third of a 1080px panel blank.

Fix: after laying out, distribute leftover vertical space back into row height and type size — grow row height up to ~96px and the minute numeral up to ~64px until the grid fills the available height. Cap the growth so 6 stops still fits.
Alternative (cheaper): when total departures across all cards is low, drop to a single wide column of full-width cards — bigger type, no dead space.

### 2. Collapse and demote empty stops
Two "NO UPCOMING DEPARTURES" cards occupy the entire top row — the two most valuable positions on the board — and are each as tall as a card with three live departures.

- Sort cards: stops with departures first, empty stops last.
- Render an empty stop as a single-line card: `120th Ave NE & NE Spring Blvd · Bay 1 · Northbound — No departures in the next 60 min`, one row tall, ~40% ink opacity, no white fill (leave it on the cream ground).
- Drop the centered letterspaced caps treatment for the empty message; it currently has more presence than real departure data.

### 3. Commit the light theme to one color rule
Light mode is currently half monochrome, half color: minute numerals are amber, `ON TIME` is green, `1 MIN LATE` is red, the LIVE dot is green, legend glyphs are colored — but the design spec says light mode is monochrome (`--ontime/--early/--late/--cancel/--sched` all `var(--ink)`), status carried by glyph + word + weight.

Pick one and apply it everywhere:
- **Monochrome (per spec, best for e-ink/high ambient):** all status ink, all numerals ink, weight and glyph do the work. LIVE dot and legend glyphs go ink too.
- **Color (if the panel is a real LCD):** then re-pick the values for paper — `#22c55e` green and `#d4b14a` amber both fail on `#f5f3ee` at distance. Use darkened equivalents (~`#1a7f3c` on-time, `#8a5a00` early, `#9b1c1c` late, `#1e4f8a` scheduled) and stop tinting the minute numeral by status — the numeral should be one constant ink so the *number* is never the thing that changes color.

### 4. Fix the clock — it currently reads as three numbers
`7:52 :47 PM` parses as a broken string: the meridiem lands after the seconds. Options, best first:
- Drop live seconds from the hero clock entirely (the footer already says `UPDATED 7:52:18 PM`): `7:52 PM`, one size, amber-or-ink per §3.
- If seconds must tick, set them as a superscript group tight to the minutes with PM outside: `7:52`⁴⁷ `PM`, with `PM` at the same size and color as the seconds, baseline-aligned to the hour.

Also: kern the `:` in `7:52` tighter (Plex Mono colon at 52px reads as a gap) and give the whole clock `font-variant-numeric: tabular-nums` so it doesn't shift width every minute.

### 5. Alert band is truncated mid-word
`…will have changes ranging fro…` — the headline is single-line-clipped and the body sentence never renders. In the design the band carries headline **plus** body.

- Allow the headline 2 lines (`-webkit-line-clamp: 2`) and render the body at 18px below it, 1 line clamped.
- Move `SERVICE ADVISORY` above the headline as a 12px caps eyebrow (left-aligned), and keep only the date window in the right rail — the right column is currently two stacked caps lines fighting each other.
- The severity left-bar (6px, per the CSS) isn't visible in the deployed build. Restore it — it's the only thing distinguishing advisory / info / alert.
- Date window shows `TUE, AUG 18, 2026 → SAT, SEP 5, 2026` while the header says August 25. Drop the year and drop the weekday: `Aug 18 → Sep 5`.

---

## P1 — Hierarchy and alignment

### 6. Stop name vs. destination are nearly the same size
Stop name 30px / destination 27px — the card heading barely outranks its own rows. Push the stop name to 36px and pull the destination to 24px, or keep sizes and make the stop name the only 700-weight element in the card.

### 7. Strip the bay out of the stop name
`120th Ave NE & NE Spring Blvd - Bay 1` in the title, then `STOP #74443 · NORTHBOUND` in the meta line — the bay and direction are split across two lines for no reason, and the hyphen-space in the title is a different dash than the em dash used elsewhere.
Fix: title = `120th Ave NE & NE Spring Blvd`; meta = `#74443 · Bay 1 · Northbound`.

### 8. Minute column collides with the card edge
`26 MIN` and `16 MIN` sit hard against the card's right padding. Give the minutes group a fixed-width right-aligned column (enough for `NOW` and three digits at final size) plus 20px of card padding beyond it, so every card's numerals form one vertical edge.

### 9. `NOW` is the weakest strong thing on the board
The one departure that is boarding right now renders in plain ink at the same size as a `16`, with a hollow "scheduled" glyph beside it. It should be the loudest element in its card: same numeral size, filled glyph or no glyph, and either accent color (color theme) or 800 weight (monochrome).

### 10. Baselines don't line up across the row
The minute numeral's baseline sits above the destination text baseline, and the status glyph is vertically centered against a 48px numeral so it floats mid-air. Align: glyph and numeral share one baseline; the destination/status stack is centered against the row box.

### 11. Glyph-to-number gap is too wide
`● 3` reads as two separate items. Tighten to ~6px and set the glyph at ~0.32× the numeral size, consistently — it currently looks like a different size per row.

### 12. Radii are inconsistent
Cards 6px, route tiles 8px, alert band 4px, alert glyph box 0. Pick two: 8px for containers (cards + alert band), 6px for chips (route tiles), and give the alert glyph box the chip radius.

---

## P2 — Detail and finish

### 13. Route tile is mostly empty space
`2 Line` at ~17px inside a 104×54 tile leaves the tile reading as a black blob. Either:
- size the tile to content (pill, 12px horizontal padding) for word-routes like `2 Line` / `B Line`, keeping the fixed square only for numeric routes; or
- keep the fixed tile and raise word-route type to ~22px with condensed tracking.

Also the tile's text color deviates from the spec (`--badge-ink: #f5f3ee` in light mode) — it's rendering warm amber. Pick the cream per spec, or make amber-on-black the intentional light-mode tile and delete the unused token.

### 14. Card surface has no separation from the ground
White cards on `#f5f3ee` with a `#c7c4bd`-ish hairline is very quiet at distance. Add either a 1px `#0a0a0a` at 12% border (crisper) or a flat `0 1px 0` bottom edge. No blur, no soft shadow — it's a paper board, not a web card.

### 15. Duplicate status vocabulary
Every row says the status in words (`ON TIME`, `3 MIN EARLY`), *and* shows a glyph, *and* the footer legend explains the glyphs. That's three encodings of one fact. Keep the word for deviations (`3 MIN EARLY`, `1 MIN LATE`, `CANCELED`) and drop the redundant `ON TIME` / `SCHEDULED` words on rows where the glyph plus ink color already says it — or drop the footer legend, which is the least useful of the three at glance distance.

### 16. Column spine
With cards of unequal height and no vertical rule, the two columns drift apart. Either add a 1px column rule at the gap midpoint, or align the tops of row-2 cards across both columns (grid rows, not `auto-rows: min-content`) so there's one shared horizontal line.

### 17. Small-caps tracking is over-set
`0.16–0.22em` at 12–13px turns meta lines into texture. Bring meta tracking to `0.10em` and reserve `0.20em+` for the `DEPARTURES` wordmark, where it's doing real work.

### 18. Header lockup
The BRIDGE Housing mark and `The Briar` are butted together with no separator and no shared baseline (the mark's optical center sits above the text). Add a 1px vertical divider or 24px gap, align the wordmark's cap-height to the mark's optical center, and consider restoring the `BRIDGE HOUSING` operator caps line under `The Briar` for symmetry with the clock stack on the right.

### 19. `DEPARTURES` is mathematically centered, not optically
It's centered in the board, so it sits left of the visual midpoint between the two heavier end blocks. Center it between the logo lockup's right edge and the clock's left edge instead.

---

## Deliberately not changing

- The one-card-per-stop rule and the absence of a featured stop — still correct.
- Glyph + word status encoding — keep it, just de-duplicate (§15).
- Cream/white paper palette and IBM Plex Condensed/Mono pairing.

## Open questions for the build

- Is the target panel an LCD or e-ink? Answer decides §3 outright.
- Is 4 stops the normal case for The Briar? If so, the fill strategy in §1 should be tuned for 4, not 6.
- Should stops with no service in the next hour drop off the board entirely after some window, rather than collapse (§2)?

---

## Build decisions (resolved 2026-08-25)

- **Scope:** all 19 items, P0–P2, one plan.
- **§1 fill strategy:** adaptive row growth (row height 64→96px, numeral 48→64px). No single-wide-column fallback.
- **§2 empty stops:** sort last, collapse to one dim line. They stay on the board; no drop-off window.
- **§15 de-duplication:** drop the redundant `ON TIME` / `SCHEDULED` words on rows; keep the footer legend.

## Corrections to this spec found while reading the code

These override the spec text where they conflict.

1. **§3 is largely already built.** `colorMode` (`color` | `mono`) exists in `src/lib/config/defaults.js:4`, and `.theme-mono` (`src/app.css:115`) already collapses `--ontime/--early/--late/--cancel/--sched` to `var(--ink)`. The e-ink answer is a settings flip, not a code change. The light `color` palette is also already darkened for paper (`--ontime: #1f7a3a`, `--early: #a35f08`, `--late: #b8402a`, `--sched: #2f5c99`) — the `#22c55e`/`#d4b14a` values the spec cites are not in the code. The only real §3 defect is `stop-row.svelte:115`, which tints the minute numeral `var(--accent)` vs `var(--ink)` by status.
2. **§5's severity bar is not a missing style — it is an unmapped vocabulary.** `app.css:171-176` defines `.alert-advisory/.alert-info/.alert-alert`, but `alert-band.svelte:13` builds the class from the raw OBA `severity` string, whose vocabulary is GTFS-RT-style (`noImpact`, `verySlight`, `slight`, `normal`, `severe`, `verySevere`, `unknown`). None of those match, so no `--alert-tone` is ever set and neither the bar nor the tint draws. Fix is a mapping function, not CSS.
3. **§16's "align the tops of row-2 cards" is already true.** CSS grid rows share a start line across columns, so tops already align under `grid-auto-rows: min-content`; what differs is card *bottoms*. The column rule is the part of §16 that adds something, so that is what gets built.
4. **§19 is already implemented.** The header is `grid-template-columns: auto 1fr auto` and `DEPARTURES` is centered inside the `1fr` track — which is by definition the span between the logo lockup's right edge and the clock's left edge. No change; verify visually and leave it.
5. **§2's literal copy is wrong about the window.** `oba.arrivalAndDeparture.list(stopID)` is called with no window parameters (`src/routes/api/oba/arrivals-and-departures-for-stop/[id]/+server.js:12`), so the board shows OBA's server default, not 60 minutes. The collapsed line uses "No upcoming departures" rather than asserting a window the code does not set.
6. **§18's operator caps line is not implementable as specced.** Branding exposes only `logoUrl` and `regionName` (`src/lib/config/branding.js:40-44`); there is no second "operator" field to render under the agency name. The divider and gap are built; the operator line is out of scope pending a new branding field.
