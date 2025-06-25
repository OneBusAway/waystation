// @vitest-environment jsdom

import { render } from '@testing-library/svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import Departure from './departure.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

test('renders successfully with departure data', async () => {
	const div = document.createElement('div');
	const predictedDepartureTime = new Date().getTime() + 1000 * 60 * 5;
	const predictedDepartureDate = new Date(predictedDepartureTime);

	const predictedDepartureTimestr = predictedDepartureDate.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit'
	});

	const dep = {
		routeShortName: '10',
		tripHeadsign: 'Downtown',
		predictedDepartureTime: new Date().getTime() + 1000 * 60 * 5,
		scheduledDepartureTime: new Date().getTime()
	};

	render(Departure, {
		props: { dep },
		target: div
	});

	await vi.runAllTimersAsync();

	expect(div.innerHTML).toContain('10');
	expect(div.innerHTML).toContain('Downtown');
	expect(div.innerHTML).toContain('Arriving in');
	expect(div.innerHTML).toContain('5');
	expect(div.innerHTML).toContain('min');
	expect(div.innerHTML).toContain(predictedDepartureTimestr);
});

test('renders successfully with "Departing" status', async () => {
	const div = document.createElement('div');
	const dep = {
		routeShortName: 'A12',
		tripHeadsign: 'Downtown Express',
		predictedDepartureTime: new Date().getTime(),
		scheduledDepartureTime: new Date().getTime()
	};

	const predictedDepartureTime = new Date().getTime();
	const predictedDepartureDate = new Date(predictedDepartureTime);

	const predictedDepartureTimestr = predictedDepartureDate.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit'
	});

	render(Departure, {
		props: { dep },
		target: div
	});

	await vi.runAllTimersAsync();

	expect(div.innerHTML).toContain('A12');
	expect(div.innerHTML).toContain('Downtown Express');
	expect(div.innerHTML).toContain('Departing now');
	expect(div.innerHTML).toContain(predictedDepartureTimestr);
});

test('renders successfully with no status or minutes', async () => {
	const div = document.createElement('div');
	const dep = {
		routeShortName: 'C78',
		tripHeadsign: 'Central Station',
		predictedDepartureTime: new Date().getTime(),
		scheduledDepartureTime: new Date().getTime()
	};

	const predictedDepartureTime = new Date().getTime();
	const predictedDepartureDate = new Date(predictedDepartureTime);

	const predictedDepartureTimestr = predictedDepartureDate.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit'
	});

	render(Departure, {
		props: { dep },
		target: div
	});

	await vi.runAllTimersAsync();

	expect(div.innerHTML).toContain('C78');
	expect(div.innerHTML).toContain('Central Station');
	expect(div.innerHTML).toContain(predictedDepartureTimestr);
	expect(div.innerHTML).not.toContain('Delayed');
});
