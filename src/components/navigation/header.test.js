// @vitest-environment jsdom

import { render } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import Header from './header.svelte';

vi.mock('$lib/formatters.js', () => ({
	formatDate: () => 'Mocked Date',
	formatTime: () => 'Mocked Time'
}));

test('renders successfully', () => {
	const div = document.createElement('div');
	render(Header, {
		props: {
			title: 'Hello Test World',
			imageUrl: 'https://example.com/image.jpg'
		},
		target: div
	});

	expect(div.innerHTML).toContain('Hello Test World');
});
