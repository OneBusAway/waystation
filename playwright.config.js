import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
	testDir: './tests',
	timeout: 30_000,
	use: {
		baseURL: 'http://127.0.0.1:4173',
		viewport: { width: 1920, height: 1080 },
		launchOptions: executablePath ? { executablePath } : undefined
	},
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
		url: 'http://127.0.0.1:4173/api/config',
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
		env: {
			WAYSTATION_CONFIG_PATH: '.svelte-kit/playwright-settings.json',
			PUBLIC_OBA_LOGO_URL: '',
			PUBLIC_OBA_REGION_NAME: 'Sound Transit',
			PUBLIC_OBA_SERVER_URL: 'https://api.pugetsound.onebusaway.org/',
			PRIVATE_OBA_API_KEY: 'test'
		}
	}
});
