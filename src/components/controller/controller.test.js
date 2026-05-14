// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/svelte';
import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import Controller from './controller.svelte';

beforeEach(() => {
	vi.restoreAllMocks();
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

test('renders a departure after fetching', async () => {
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

	document.getElementById = vi.fn().mockImplementation((id) => {
		if (id === 'footer') return { offsetHeight: 50 };
		return null;
	});

	const { getByText } = render(Controller, { props: { stopIDs: ['agency_123'] } });

	await waitFor(() => {
		expect(getByText('Test Trip')).toBeTruthy();
		expect(getByText('Test Stop')).toBeTruthy();
	});
});

test('cycles through situations on 2+ fetches', async () => {
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
								situations: [
									{
										summary: {
											lang: 'en',
											value:
												'Conan Gray tonight at Climate Pledge Arena, starts 8:00 p.m. Please plan ahead for additional travel time.'
										}
									},
									{
										summary: {
											lang: 'en',
											value:
												'Northgate Station Garage will be closed for maintenance Saturday, March 21 and Sunday, March 22.'
										}
									},
									{
										summary: {
											lang: 'en',
											value:
												'Angle Lake Garage elevator 2 unavailable until further notice due to unscheduled outage. Please use adjacent elevator.'
										}
									}
								]
							}
						}
					})
			})
		)
	);

	document.getElementById = vi.fn().mockImplementation((id) => {
		if (id === 'footer') return { offsetHeight: 50 };
		return null;
	});

	const { component, getByText } = render(Controller, { props: { stopIDs: ['agency_123'] } });

	await waitFor(() => {
		expect(getByText('Test Trip')).toBeTruthy();
		expect(getByText('Test Stop')).toBeTruthy();
		expect(getByText(/Conan Gray/)).toBeTruthy();
	});

	await component.fetchStops();

	await waitFor(() => {
		expect(getByText(/Northgate Station Garage will/)).toBeTruthy();
	});

	await component.fetchStops();

	await waitFor(() => {
		expect(getByText(/Angle Lake Garage elevator 2/)).toBeTruthy();
	});

	await component.fetchStops();

	await waitFor(() => {
		expect(getByText(/Conan Gray/)).toBeTruthy();
	});
});

test('renders side-display alerts without crashing on wide screens', async () => {
	// Regression test: on wide screens sideDisplay flips true after the fetch completes,
	// which previously caused a Svelte branch-switch crash in destroy_effect → get_next_sibling.
	vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1800);

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
								stops: { agency_123: { id: 'agency_123', name: 'Test Stop' } },
								situations: [{ summary: { lang: 'en', value: 'Test service alert' } }]
							}
						}
					})
			})
		)
	);

	document.getElementById = vi.fn().mockImplementation((id) => {
		if (id === 'footer') return { offsetHeight: 50 };
		return null;
	});

	const { getByText } = render(Controller, { props: { stopIDs: ['agency_123'] } });

	await waitFor(() => {
		expect(getByText('Test Trip')).toBeTruthy();
		expect(getByText('Test service alert')).toBeTruthy();
	});
});
