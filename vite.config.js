import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

import { paraglideVitePlugin } from '@inlang/paraglide-js';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,

	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],

	test: {
		workspace: [
			{
				extends: './vite.config.js',
				plugins: [svelteTesting()],

				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.js']
				}
			},
			{
				extends: './vite.config.js',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		],
		coverage: {
			provider: 'v8',
			reporter: ['html', 'lcov'],
			reportsDirectory: './coverage',
			all: true,
			exclude: ['**/tests', '.svelte-kit', 'build', 'coverage', 'node_modules']
		}
	}
});
