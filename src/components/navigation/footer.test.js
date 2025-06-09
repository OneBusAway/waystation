// @vitest-environment jsdom

import { render } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Footer from './footer.svelte';

test('renders successfully with one stop', () => {
	const stops = [{ code: '12345', name: 'Stop Test Example' }];

	const { container } = render(Footer, {
		props: { stops }
	});

	expect(container.innerHTML).toContain('Waystation by Open Transit Software Foundation');
	expect(container.innerHTML).toContain('Stop Test Example');
});
