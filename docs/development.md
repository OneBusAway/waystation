# Developer Guide

This guide provides the essentials for setting up a development environment, running the app, and contributing safely.


## Getting Started

### 1. Prerequisites

* Node.js v16+
* npm

### 2. Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```
3. Create a `.env` file for environment variables (see below).

### 3. Environment Variables

Define the following keys in `.env`:

```env
PUBLIC_OBA_LOGO_URL="https://onebusaway.org/wp-content/uploads/oba_logo-1.png"
PUBLIC_OBA_REGION_NAME="Sound Transit"
PUBLIC_OBA_SERVER_URL="https://api.pugetsound.onebusaway.org/"
PRIVATE_OBA_API_KEY="test"
```

> [!TIP]  
> OBA API usage may be rate-limited. Contact the project admins via [Slack](https://opentransitsoftwarefoundation.org/join-our-slack/) if you encounter issues.

### 4. Testing

* Each component or utility has an accompanying `.test.js` file.
* Ensure your changes do not break existing tests.
* Add tests for any new functionality.

```bash
npm test
```

## Documentation

* [OneBusAway JS-SDK](https://github.com/OneBusAway/js-sdk) — technical details & testing.
* [OBA Documentation](https://developer.onebusaway.org/) — general API reference.
* [Routing Guide](routing.md) — Waystation architecture overview.
* [API Reference](api-reference.md) — list of internal API endpoints.

## Support

* For further help & guidance, check our [Support](../SUPPORT.md) framework!
