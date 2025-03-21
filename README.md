# Waystation

![Waystation-Heading](https://github.com/user-attachments/assets/005a2d71-4e9e-4335-91a6-61270b3faeec)

Waystation is the next-generation [Sign Mode](https://developer.onebusaway.org/features/sign-mode) for OneBusAway. It serves as a transit information screen designed to display real-time arrivals and departures for a given transit stop. Built with [SvelteKit](https://kit.svelte.dev/), Waystation provides a modern, standalone web application that empowers transit agencies and businesses to create efficient and visually appealing public transit information systems.

## Features

- Real-time transit information display.
- Customizable branding with agency logos and region names.
- Easy integration with OneBusAway API.
- Modern, responsive design built with SvelteKit.

## `.env` File Keys

- `PUBLIC_OBA_LOGO_URL` string: (required) The URL of your transit agency's logo.
- `PUBLIC_OBA_REGION_NAME` string: (required) displayed in the header.
- `PUBLIC_OBA_SERVER_URL` string: (required) Your OBA API server's URL.
- `PRIVATE_OBA_API_KEY` string: (required) Your OneBusAway REST API server key.
- `PRIVATE_DEPARTURES` array: (required) Unique identifier for a transit stop.

## Development

To get started, set up Waystation for local development:

1. **Install Dependencies and Set Up Environment Variables** - Ensure you have [Node.js](https://nodejs.org/) (v16 or higher) and [npm](https://www.npmjs.com/) installed. Then, install the project dependencies and set up your environment variables:

   ```bash
   npm install          # Install project dependencies
   cp .env.example .env # Copy the example environment file to .env
   ```

   > Edit the `.env` file to match your OneBusAway API credentials and other required settings. By default, this should work:

   ```env
   PUBLIC_OBA_LOGO_URL="https://onebusaway.org/wp-content/uploads/oba_logo-1.png"
   PUBLIC_OBA_REGION_NAME="Sound Transit"
   PUBLIC_OBA_SERVER_URL="https://api.pugetsound.onebusaway.org/"
   PRIVATE_OBA_API_KEY="test"
   PRIVATE_DEPARTURES=[{"stopID": "1_19750", "routeIDs": ["1_102576"]}]
   ```

2. **Run the Development Server** - Launch Waystation locally:
   ```bash
   npm run dev
   ```

## Contribution

Participating in this codebase means you adhere to the [OBA Code of Conduct](https://github.com/OneBusAway/onebusaway/blob/master/CODE_OF_CONDUCT.md).

**Getting Started:**

- Fork the project on GitHub.
- Create a feature branch.
- Write tests and code.
- If you have multiple commits, squash them into one commit. See [this article](http://eli.thegreenplace.net/2014/02/19/squashing-github-pull-requests-into-a-single-commit) and [this Git documentation](http://git-scm.com/book/en/Git-Tools-Rewriting-History#Squashing-Commits) for instructions.
- Push the commit to your fork.
- Submit a pull request with a motive for your change and the method you used to achieve it.
- Mention related issues in the pull request description or comments.

**We will accept pull requests if:**

- The code has proper tests and all tests pass (or it is a test exposing a failure in existing code).
- It can be merged without problems (if not, please use: `git rebase main`).
- It doesn't break any existing functionality.
- It's quality code that conforms to standard style guides and best practices.
- The description includes a motive for your change and the method you used to achieve it.
- It is not a catch-all pull request but rather fixes a specific issue or implements a specific feature.
- It keeps the OneBusAway codebase clean and well-structured.
- We think other users will benefit from the same functionality.
- If it makes changes to the UI, the pull request should include screenshots.
- It is a single commit (please use `git rebase -i` to squash commits).

## Development Tips

Explore the Codebase:

- `/src/` - Core application logic.
- `/src/components/` - Components and their connections.
- `/src/lib` - Data fetching and other functionalities.

- Run the test suite to ensure functionality:

  ```bash
  npm test
  ```

  > Consider creating unit tests for each new feature or component you add.

- Lint and format your code to maintain consistency and code quality:

  ```bash
  npm run lint   # Check for linting errors
  npm run format # Format the code
  ```

  > Always lint and format your code after making changes.

- Build the project for production to ensure everything works as expected:
  ```bash
  npm run build
  ```
  > Verify that the production build is stable and running correctly with `npm run preview`.
