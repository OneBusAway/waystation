// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/svelte';
import { test, expect, vi, afterEach } from 'vitest';
import Controller from './controller.svelte';

test('renders a departure after fetching', async () => {
	afterEach(() => {
		cleanup();
	});

	vi.stubGlobal(
		'fetch',
		vi.fn(() =>
			Promise.resolve({
				json: () =>
					Promise.resolve({
						data: {
							entry: {
								arrivalsAndDepartures: [
									{
										predictedDepartureTime: Date.now() + 5 * 60_000,
										scheduledDepartureTime: Date.now() + 7 * 60_000,
										tripId: 'trip1',
										stopId: 'agency_123',
										routeShortName: '10',
										tripHeadsign: 'Test Trip',
										stopName: 'Test Stop'
									}
								]
							},
							references: {
								stops: {
									agency_123: { id: 'agency_123', name: 'Test Stop' }
								},
								situations: []
							}
						}
					})
			})
		)
	);

	const { getByText } = render(Controller, { props: { stopIDs: ['agency_123'] } });

	await waitFor(() => {
		expect(getByText('Test Trip')).toBeTruthy();
		expect(getByText('Test Stop')).toBeTruthy();
	});
});
