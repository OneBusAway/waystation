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

### API Routes

Server-side endpoints that expose data as JSON for the client. These act as a wrapper around upstream services to provide a consistent API.

- #### [API Reference](api-reference.md)