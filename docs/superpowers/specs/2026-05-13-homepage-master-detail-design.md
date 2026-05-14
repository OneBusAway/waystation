# Homepage Master-Detail Layout

**Date:** 2026-05-13
**Branch:** fit-and-finish

## Overview

Redesign the homepage from an unstyled agency table into a master-detail layout: a fixed sidebar listing agencies on the left and a detail pane showing stops for the selected agency on the right. The URL updates to `/?agency={id}` when an agency is selected, making the view bookmarkable.

## Architecture

### Routing

Single SvelteKit page (`src/routes/`). Agency selection calls `goto('/?agency={id}')`, which triggers SvelteKit to re-run `+page.server.js` with the updated URL search params.

### Data Flow

`+page.server.js`:
- Always fetches the full agency list via `oba.agenciesWithCoverage.list()`
- If `url.searchParams.get('agency')` is set, also fetches stop IDs via `oba.stopIdsForAgency.list(agencyId)`
- Returns `{ agencies, selectedAgencyId, stopIDs }`
- If no agency param: `selectedAgencyId: null`, `stopIDs: []`

`+page.svelte`:
- Full-height two-column flex layout
- Receives `data.agencies`, `data.selectedAgencyId`, `data.stopIDs`

### Error Handling

Invalid/unknown agency IDs cause the OBA SDK to throw; SvelteKit's existing `+error.svelte` handles it. No special casing needed.

## Components

All markup lives in `src/routes/+page.svelte`. No new component files.

### Sidebar (master pane)

- Fixed width (`w-64`), full-height, white background, right border separating it from the detail pane
- Header: "Agencies" label
- Each agency rendered as a clickable row with:
  - A small avatar showing the agency's first letter
  - The agency name
  - Active/highlighted state when `agency.id === selectedAgencyId`
- Click calls `goto('/?agency=' + agency.id)`

### Detail pane

Full remaining width, scrollable.

**Empty state** (no agency selected):
- Centered placeholder: "Select an agency to view its stops."

**Loaded state** (agency selected):
- Header row: agency name + stop count (e.g. "Sound Transit — 847 stops")
- Full-width compact table, single "Stop ID" column
- Each row: stop ID text + "View" link to `/stops/{stopID}`
- Thin row dividers, no zebra striping

## Styling

Uses existing Tailwind CSS v4 setup. Brand colors (`--color-brand-darkblue`, etc.) used for active sidebar state and link accents. No new CSS variables needed.

## Out of Scope

- Fetching stop names/codes (stop IDs only)
- The existing `/agencies/[id]` route (left as-is, no changes)
- Mobile/responsive layout
- Pagination of stops list
