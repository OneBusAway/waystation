import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import DepartureRow from './departure-row.svelte';

function arrival(overrides = {}) {
	return {
		route: '249',
		name: 'Route 249',
		dest: 'South Bellevue Station',
		min: 16,
		delta: 0,
		status: 'ONTIME',
		departureAt: Date.now() + 16 * 60000,
		tripId: 't-1',
		occupancy: 'FULL',
		...overrides
	};
}

describe('DepartureRow occupancy', () => {
	afterEach(() => cleanup());

	test('shows occupancy when enabled', () => {
		const { container } = render(DepartureRow, {
			props: { arrival: arrival(), showCrowding: true }
		});
		expect(container.querySelector('.occupancy-FULL')).not.toBeNull();
	});

	test('hides occupancy when disabled', () => {
		const { container } = render(DepartureRow, { props: { arrival: arrival() } });
		expect(container.querySelector('.occupancy-FULL')).toBeNull();
	});

	test('hides occupancy when there is no occupancy data', () => {
		const { container } = render(DepartureRow, {
			props: { arrival: arrival({ occupancy: null }), showCrowding: true }
		});
		expect(container.querySelector('[class*="occupancy-"]')).toBeNull();
	});

	test('hides occupancy for a canceled trip', () => {
		const { container } = render(DepartureRow, {
			props: { arrival: arrival({ status: 'CANCEL' }), showCrowding: true }
		});
		expect(container.querySelector('.occupancy-FULL')).toBeNull();
	});
});
