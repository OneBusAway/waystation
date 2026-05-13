// @vitest-environment jsdom

import { render, cleanup } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import Sidebar from './sidebar.svelte';

const agencies = [
	{ id: 'KCM', name: 'King County Metro' },
	{ id: 'ST', name: 'Sound Transit' },
	{ id: 'CT', name: 'Community Transit' }
];

afterEach(() => {
	cleanup();
});

describe('Sidebar', () => {
	test('renders all agency names', () => {
		const { getByText } = render(Sidebar, { props: { agencies, selectedAgencyId: null } });

		expect(getByText('King County Metro')).toBeTruthy();
		expect(getByText('Sound Transit')).toBeTruthy();
		expect(getByText('Community Transit')).toBeTruthy();
	});

	test('links encode agency id in href', () => {
		const { container } = render(Sidebar, { props: { agencies, selectedAgencyId: null } });

		const links = container.querySelectorAll('a');
		expect(links[0].getAttribute('href')).toBe('/?agency=KCM');
		expect(links[1].getAttribute('href')).toBe('/?agency=ST');
	});

	test('encodes special characters in agency id', () => {
		const special = [{ id: 'foo bar', name: 'Foo Bar Transit' }];
		const { container } = render(Sidebar, { props: { agencies: special, selectedAgencyId: null } });

		const link = container.querySelector('a');
		expect(link.getAttribute('href')).toBe('/?agency=foo%20bar');
	});

	test('marks selected agency with aria-current', () => {
		const { container } = render(Sidebar, { props: { agencies, selectedAgencyId: 'ST' } });

		const links = container.querySelectorAll('a');
		expect(links[0].getAttribute('aria-current')).toBeNull();
		expect(links[1].getAttribute('aria-current')).toBe('page');
		expect(links[2].getAttribute('aria-current')).toBeNull();
	});

	test('renders with no selected agency', () => {
		const { container } = render(Sidebar, { props: { agencies, selectedAgencyId: null } });

		const links = container.querySelectorAll('a');
		links.forEach((link) => expect(link.getAttribute('aria-current')).toBeNull());
	});

	test('renders empty list with no agencies', () => {
		const { container } = render(Sidebar, { props: { agencies: [], selectedAgencyId: null } });

		expect(container.querySelectorAll('a').length).toBe(0);
	});
});
