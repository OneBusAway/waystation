// @vitest-environment jsdom

import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach, vi } from 'vitest';
import Departure from './departure.svelte';

vi.mock('$lib/formatters', () => ({
	formatArrivalStatus: vi.fn(() => ({
		status: 'Arriving',
		eta: 3,
		scheduledTime: '12:30 PM'
	})),
	formatRouteStatus: vi.fn(() => ({
		status: 'early',
		tag: 'Early'
	})),
	formatBorderColor: vi.fn(() => ({
		borderColor: 'border-green-500'
	})),
	formatShadowColor: vi.fn(() => ({
		shadowColor: '0 0 10px green'
	})),
	formatTextColor: vi.fn(() => ({
		textColor: 'text-green-500'
	}))
}));

describe('Departure', () => {
	afterEach(() => {
		cleanup();
	});

	test('renders route info and arrival time', () => {
		const dep = {
			predictedDepartureTime: 123,
			scheduledDepartureTime: 456,
			tripHeadsign: 'USA',
			stopName: 'Liverpool',
			routeShortName: '10X'
		};

		const { container } = render(Departure, { props: { dep } });

		expect(container.innerHTML).toContain('USA');
		expect(container.innerHTML).toContain('Liverpool');
		expect(container.innerHTML).toContain('10X');
		expect(container.innerHTML).toContain('Arriving in');
		expect(container.innerHTML).toContain('3');
		expect(container.innerHTML).toContain('min');
		expect(container.innerHTML).toContain('Early');
	});
});
