// @vitest-environment jsdom

import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import Footer from './footer.svelte';

afterEach(() => {
	cleanup();
});

describe('Footer', () => {
	test('renders successfully with one stop', () => {
		const stops = [{ code: '262626', name: 'Stop Test Example' }];

		const { container } = render(Footer, {
			props: { stops }
		});

		expect(container.innerHTML).toContain('Waystation by Open Transit Software Foundation');
		expect(container.innerHTML).toContain('Stop No. 262626 - Stop Test Example');
	});

	test('renders multiple stops separated by dots', () => {
		const stops = [
			{ code: '262', name: 'Stop A' },
			{ code: '626', name: 'Stop B' }
		];

		const { container } = render(Footer, {
			props: { stops }
		});

		expect(container.innerHTML).toContain('Stop No. 262 - Stop A');
		expect(container.innerHTML).toContain('Stop No. 626 - Stop B');
		expect(container.innerHTML).toContain('•');
	});
});
