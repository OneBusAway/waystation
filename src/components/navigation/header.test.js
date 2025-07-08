// @vitest-environment jsdom

import { render, cleanup } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Header from './header.svelte';

vi.mock('$lib/formatters.js', () => ({
	formatDate: () => 'Mocked Date',
	formatDateTime: () => 'Mocked Time'
}));

afterEach(() => {
	cleanup();
});

describe('Header', () => {
	test('renders custom title and image', () => {
		const { getByText, getByAltText } = render(Header, {
			props: {
				title: 'Hello Test World',
				imageUrl: 'https://example.com/image.jpg'
			}
		});

		expect(getByText('Hello Test World')).toBeTruthy();
		expect(getByAltText('Homepage').getAttribute('src')).toBe('https://example.com/image.jpg');
	});

	test('falls back to default title and image if not provided', () => {
		const { getByText, getByAltText } = render(Header);

		expect(getByText('Transit Board')).toBeTruthy();
		expect(getByAltText('Homepage').getAttribute('src')).toBe(
			'https://onebusaway.org/wp-content/uploads/oba_logo-1.png'
		);
	});

	test('displays mocked date and time correctly', () => {
		const { getByText } = render(Header);

		expect(getByText('Mocked Date')).toBeTruthy();
		expect(getByText('Mocked Time')).toBeTruthy();
	});
});
