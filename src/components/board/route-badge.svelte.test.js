import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import RouteBadge from './route-badge.svelte';

const text = (container) => container.querySelector('.route-badge > div');

describe('RouteBadge', () => {
	afterEach(() => cleanup());

	test('keeps the large size for a short route number', () => {
		const { container } = render(RouteBadge, { props: { route: '49' } });
		expect(text(container).style.fontSize).toBe('80px');
	});

	test('steps down the size for a word route', () => {
		const { container } = render(RouteBadge, { props: { route: 'Monorail' } });
		expect(text(container).style.fontSize).toBe('32px');
	});

	test('truncates on one line instead of overflowing the tile', () => {
		const { container } = render(RouteBadge, { props: { route: 'Edmonds - Kingston' } });
		const el = text(container);
		expect(el.style.whiteSpace).toBe('nowrap');
		expect(el.style.overflow).toBe('hidden');
		expect(el.style.textOverflow).toBe('ellipsis');
		expect(el.style.maxWidth).toBe('132px');
	});
});
