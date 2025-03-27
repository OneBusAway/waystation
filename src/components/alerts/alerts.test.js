// @vitest-environment jsdom

import { render } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Alerts from './alerts.svelte';
import { situationsStore } from '$lib/situations';

test('renders nothing when no alerts exist', () => {
	const div = document.createElement('div');

	// Mock empty situations store
	situationsStore.set([]);

	render(Alerts, {
		target: div
	});

	expect(div.innerHTML).toContain('<div class="mx-0 my-9 mr-4 p-0"><!----></div>');
	expect(div.innerHTML).not.toContain('SCHEDULED<br>MAINTENANCE');
});

test('renders successfully with alert data', () => {
	const div = document.createElement('div');

	// Mock situations store with alert data
	situationsStore.set([
		{
			summary: { value: 'Test Alert Title' },
			description: { value: 'Test alert description details' }
		}
	]);

	render(Alerts, {
		target: div
	});

	expect(div.innerHTML).toContain('SCHEDULED<br>MAINTENANCE');
	expect(div.innerHTML).toContain('Test Alert Title');
	expect(div.innerHTML).toContain('Test alert description details');
	expect(div.innerHTML).toContain('bg-gradient-to-r');
});

test('renders with empty strings when alert has no summary or description', () => {
	const div = document.createElement('div');

	// Mock situations store with minimal alert data
	situationsStore.set([{}]);

	render(Alerts, {
		target: div
	});

	expect(div.innerHTML).toContain('SCHEDULED<br>MAINTENANCE');
	expect(div.innerHTML).toContain('<div class="mb-3 text-2xl font-extrabold text-white"></div>');
	expect(div.innerHTML).toContain('<div class="text-lg font-normal text-white"></div>');
});
