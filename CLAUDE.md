# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Waystation is a real-time transit information display built with SvelteKit for transit agencies using OneBusAway. It shows arrival/departure times, service alerts, and supports multi-language display (English, German, Arabic, Spanish, French). Licensed under AGPL-3.0.

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build (uses @sveltejs/adapter-node)
npm run preview       # Preview production build
npm test              # Run all tests once (CI mode)
npm run test:unit     # Run tests with coverage
npm run lint          # Check formatting (Prettier) + linting (ESLint)
npm run format        # Auto-format with Prettier
npm run check         # Type check with svelte-check
```

Run a single test file:
```bash
npx vitest run src/lib/formatters.test.js
```

## Test Architecture

Vitest is configured with two workspaces in `vite.config.js`:
- **Client tests** (`*.svelte.test.js`): Run in jsdom with `@testing-library/svelte`. Setup in `vitest-setup-client.js`.
- **Server tests** (`*.test.js`, excluding `*.svelte.test.js`): Run in Node environment.

Component tests mock `fetch` and use `@testing-library/svelte` for rendering/querying.

## Code Architecture

**SvelteKit routes** (`src/routes/`):
- `/` — Home page listing agencies
- `/stops/[stopID]` — Main departure display. Supports multiple stops via `+` separator in the URL.
- `/admin` — Configuration dashboard (language, departure limits, refresh interval)
- `/api/config` — GET/POST for JSON-based config stored at `src/lib/config/settings.json`
- `/api/oba/*` — Server-side proxy to OneBusAway API with in-memory `Map()` caching. On upstream failure, returns cached data with a `stale: true` flag; otherwise 503.

**Controller component** (`src/components/controller/controller.svelte`): Central orchestrator that fetches departure data on a configurable interval, transforms API responses through formatters, and manages loading/error state.

**Formatters** (`src/lib/formatters.js`): Pure functions for arrival status, time display, color coding, sorting, and deduplication of departures. This is the most heavily tested module.

**OBA SDK wrapper** (`src/lib/obaSdk.js`): Initializes the `onebusaway-sdk` client with env vars and provides `handleOBAResponse()` for validating API responses.

**i18n**: Uses inlang Paraglide JS. Translation messages are in `messages/` as JSON files per locale. Generated runtime code goes to `src/lib/paraglide/`. Import translations as `import * as t from '$lib/paraglide/messages.js'`. Service alerts are translated dynamically via Google Translate proxy in `formatters.js`.

## Conventions

- **Svelte 5 runes**: Components use `$state`, `$props`, `$effect` — not Svelte 4 stores.
- **Path aliases**: `$components` → `./src/components`, `$lib` → `./src/lib` (SvelteKit default).
- **Formatting**: Tabs, single quotes, no trailing commas, 100-char line width (see `.prettierrc`). Prettier plugins for Svelte and Tailwind.
- **Styling**: Tailwind CSS v4 with custom theme colors defined as CSS variables in `src/app.css` (e.g., `--color-brand-red`). Uses viewport-width units (vw) for responsive sizing on display screens.
- **Environment variables**: Defined in `.env` (see `.env.example`). Public vars prefixed `PUBLIC_OBA_*`, private as `PRIVATE_OBA_*`. Accessed via SvelteKit's `$env/static/public` and `$env/static/private`.
