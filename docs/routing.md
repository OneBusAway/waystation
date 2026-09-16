# Waystation Routes

At the heart of SvelteKit is a [filesystem-based router](https://svelte.dev/docs/kit/routing). The routes of Waystation are defined into two main categories: Page routes & API routes.  

- `/src/routes`
    1. Page routes:  
        - `/admin`  
        - `/agencies/[id]`  
        - `/stops/[stopID]`  
    2. API routes:
        - `/api`
            1. `/config`
            2. OneBusAway API:
                - `/oba/arrivals-and-departures-for-stop/[id]`
                - `/oba/name-and-code-for-stop/[id]`

### Page Routes

The user interface layer of the application. Each route corresponds to a Waystation board page, such as the administration dashboard, the agencies list, or stop details.

Each page assembles UI components and manages navigation across the Waystation board.

- Fetches JSON data from the server.
- Displays parsed results as real-time departures and arrivals.

#### Multi-screen pagination

`/stops/[stopID]` accepts two optional query params to split one stop's departures across several physical displays, for hubs where all departures don't fit on a single screen:

- `screens` (integer, ≥ 1, default `1`) — total number of screens sharing this stop.
- `screen` (integer, 1-indexed, default `1`) — which slice this display renders.

Example, a stop split across 3 screens:

- `/stops/1_75403?screen=1&screens=3`
- `/stops/1_75403?screen=2&screens=3`
- `/stops/1_75403?screen=3&screens=3`

Each display independently fetches, sorts, and slices the same stop — there is no coordination between screens, so any one can crash, reboot, or be replaced without affecting the others. Invalid or out-of-range values (e.g. `screen=0`, `screens=-1`) fall back to the single-screen default rather than erroring. `maxDepartures` applies as a total cap across the whole wall, not per screen, and is divided across screens as evenly as possible — any remainder goes to the earliest screens first, so no screen is left empty just because the total didn't divide evenly (e.g. `maxDepartures: 4` split across 3 screens renders 2/1/1, not 2/2/0). A single screen can render at most 5 rows, so the effective total is capped at `5 × screens` even if `maxDepartures` is set higher. Omitting both params renders exactly as before.

### API Routes

Server-side endpoints that expose data as JSON for the client. These act as a wrapper around upstream services to provide a consistent API.

- #### [API Reference](api-reference.md)