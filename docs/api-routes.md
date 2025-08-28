# API Routes Reference

This document defines the internal API endpoints of the Waystation app. These endpoints supply data to UI components, persist configuration, and ensure resilience through cached responses when upstream fetches fail.

> **Note:** These endpoints are server-side only. They should not be exposed publicly without proper security measures.

## `/api/config`

### GET

* **Description:** Returns the current Waystation configuration.
* **Parameters:** None
* **Request Body:** None
* **Response:**

  ```json
  {
    "maxDepartures": 4,
    "updateInterval": 30
  }
  ```
* **Error Handling:** Returns `200` with the current configuration. (No caching or error state).


### POST

* **Description:** Saves a new configuration object.
* **Parameters:** None
* **Request Body:** JSON object with configuration values.

  ```json
  {
    "maxDepartures": 4,
    "updateInterval": 30
  }
  ```
* **Response:**

  ```json
  { "success": true }
  ```
* **Error Handling:** Returns `400` or `500` if the request body is invalid or persistence fails.

## `/api/oba/arrivals-and-departures-for-stop/[id]`

### GET

* **Description:** Fetches real-time arrivals and departures for a given stop ID from OBA. Responses are cached by stop ID.
* **Parameters:**

  * `id` (path) → Stop ID (string).
* **Request Body:** None
* **Response:** Example OBA response:

  ```json
  {
    "data": {
      "entry": {
        "arrivalsAndDepartures": [ ... ]
      },
      "references": { ... }
    }
  }
  ```
* **Caching:** Latest successful response is cached in memory.
* **Error Handling:**

  * If OBA fetch fails but a cached response exists → returns cached response with `{ "stale": true }`.
  * If no cached response is available → returns `503 Service Unavailable`.

## `/api/oba/name-and-stop-for-code/[id]`

### GET

* **Description:** Retrieves stop metadata (name, details, IDs) for one or more stop IDs. Responses are cached per stop ID.
* **Parameters:**

  * `id` (path) → One or multiple stop IDs, joined with `+` (e.g. `40_99603+40_99604+40_99605`).
* **Request Body:** None
* **Response:** Array of stop entries:

  ```json
  [
    {
      "id": "40_99603",
      "code": "99603",
      "name": "Capitol Hill",
      "lat": 47.619621,
      "lon": -122.320038,
      "direction": "N",
      "wheelchairBoarding": "ACCESSIBLE"
    }
  ]
  ```
* **Caching:** Each stop ID response is cached in memory.
* **Error Handling:**

  * If OBA fetch fails but **all stop IDs** exist in cache → returns cached responses with `{ "stale": true }`.
  * If some or all stop IDs are missing from cache → returns `503 Service Unavailable`.
