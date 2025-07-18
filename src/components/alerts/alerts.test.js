// @vitest-environment jsdom

import { render, cleanup } from '@testing-library/svelte';
import { expect, test, describe, afterEach } from 'vitest';
import Alerts from './alerts.svelte';

describe('Alerts component sidebar mode', () => {
	afterEach(() => {
		cleanup();
	});

	test('renders successfully with alert data', () => {
		const { container, getByText } = render(Alerts, {
			props: {
				situations: [
					{
						summary: { value: 'Test Alert Title' },
						activeWindows: [
							{
								from: 1718948400000,
								to: 1718952000000
							}
						]
					}
				],
				displayMode: true
			}
		});

		expect(getByText('Your attention required!')).toBeTruthy();
		expect(getByText('Test Alert Title')).toBeTruthy();
		expect(getByText('Starting')).toBeTruthy();
		expect(getByText('Ending')).toBeTruthy();
		expect(container.textContent).toContain('➔');
	});

	test('renders with only start date', () => {
		const { getByText, queryByText, container } = render(Alerts, {
			props: {
				situations: [
					{
						summary: { value: 'Test Alert Title' },
						activeWindows: [
							{
								from: 1718948400000
							}
						]
					}
				],
				displayMode: true
			}
		});

		expect(getByText('Starting')).toBeTruthy();
		expect(queryByText('Ending')).toBeNull();
		expect(container.innerHTML).not.toContain('➔');
	});

	test('renders with only end date', () => {
		const { getByText, queryByText, container } = render(Alerts, {
			props: {
				situations: [
					{
						summary: { value: 'Test Alert Title' },
						activeWindows: [
							{
								to: 1718952000000
							}
						]
					}
				],
				displayMode: true
			}
		});

		expect(queryByText('Starting')).toBeNull();
		expect(getByText('Ending')).toBeTruthy();
		expect(container.innerHTML).not.toContain('➔');
	});

	test('handles invalid dates', () => {
		const { queryByText, container } = render(Alerts, {
			props: {
				situations: [
					{
						summary: { value: 'Test Alert Title' },
						activeWindows: [
							{
								from: 'invalid',
								to: 'invalid'
							}
						]
					}
				],
				displayMode: true
			}
		});

		expect(queryByText('Starting')).toBeNull();
		expect(queryByText('Ending')).toBeNull();
		expect(container.innerHTML).not.toContain('➔');
	});
});
