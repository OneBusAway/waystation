import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import NightView from './night-view.svelte';

function arrival(overrides = {}) {
	return {
		route: '249',
		name: 'Route 249',
		dest: 'South Bellevue Station',
		min: 6,
		delta: 0,
		status: 'ONTIME',
		departureAt: Date.now() + 6 * 60000,
		tripId: `t-${Math.random()}`,
		...overrides
	};
}

describe('NightView', () => {
	afterEach(cleanup);

	test('renders at most two departures', () => {
		const { container } = render(NightView, {
			props: { arrivals: [arrival(), arrival(), arrival()], now: new Date() }
		});
		expect(container.querySelectorAll('.night-row')).toHaveLength(2);
	});

	test('renders an empty state with no departures', () => {
		const { container } = render(NightView, { props: { arrivals: [], now: new Date() } });
		expect(container.querySelector('.night-empty')).not.toBeNull();
	});
});
