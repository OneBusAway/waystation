// @vitest-environment jsdom

import { render } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import Footer from './footer.svelte';

vi.stubGlobal(
	'fetch',
	vi.fn(() =>
		Promise.resolve({
			ok: true,
			json: () =>
				Promise.resolve({
					code: '1',
					name: 'Stop Test Example'
				})
		})
	)
);

beforeEach(() => vi.useFakeTimers());

test('renders successfully', async () => {
	const div = document.createElement('div');
	render(Footer, {
		props: {},
		target: div
	});

	await vi.runAllTimersAsync();

	expect(div.innerHTML).toContain('Waystation by Open Transit Software Foundation');
	expect(div.innerHTML).toContain('Stop Test Example');
});
