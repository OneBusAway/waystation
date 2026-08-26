// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import MultiStopBoard from './multi-stop-board.svelte';

const now = new Date('2026-08-25T23:02:00Z');

function stop(id, arrivals = [], extra = {}) {
	return {
		id,
		code: id.split('_')[1],
		name: `Stop ${id}`,
		direction: 'N',
		arrivals,
		failed: false,
		...extra
	};
}

function arrival(overrides = {}) {
	return {
		route: '249',
		name: 'Route 249',
		dest: 'South Bellevue Station',
		min: 6,
		delta: -2,
		status: 'EARLY',
		stopName: '',
		departureAt: now.getTime() + 6 * 60000,
		tripId: `t-${Math.random()}`,
		...overrides
	};
}

describe('MultiStopBoard', () => {
	afterEach(() => cleanup());

	test('renders one card per stop with stop code and direction', () => {
		// A stop with no departures collapses to a one-line card (Task 5) and no longer shows
		// its meta line, so this needs live arrivals to exercise the full card's meta line.
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_100', [arrival()]), stop('1_200', [arrival()])],
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		expect(container.querySelectorAll('section').length).toBe(2);
		expect(container.innerHTML).toContain('#100');
		expect(container.innerHTML).toContain('Northbound');
	});

	test('spells out status phrase and caps rows per card by grid shape', () => {
		const many = Array.from({ length: 8 }, () => arrival());
		const stops = Array.from({ length: 5 }, (_, i) => stop(`1_${i}`, many));
		const { container } = render(MultiStopBoard, {
			props: { stops, now, lastUpdatedAt: now.getTime() }
		});
		const firstCard = container.querySelector('section');
		expect(firstCard.querySelectorAll('.route-badge').length).toBe(4);
		expect(firstCard.innerHTML).toContain('2 MIN EARLY');
	});

	test('two stops show up to six departures each', () => {
		const many = Array.from({ length: 8 }, () => arrival());
		const { container } = render(MultiStopBoard, {
			props: { stops: [stop('1_1', many), stop('1_2', many)], now, lastUpdatedAt: now.getTime() }
		});
		expect(container.querySelector('section').querySelectorAll('.route-badge').length).toBe(6);
	});

	test('shows empty and failed states per card', () => {
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_1'), stop('1_2', [], { failed: true })],
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		// §2 replaced the centred caps block with a sentence-case collapsed line.
		expect(container.innerHTML).toContain('No upcoming departures');
		expect(container.innerHTML).toContain('DATA UNAVAILABLE');
	});

	test('renders the alert band when an alert is present', () => {
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_1')],
				now,
				lastUpdatedAt: now.getTime(),
				alert: { summary: { value: 'Route 226 canceled tonight' }, severity: 'alert' }
			}
		});
		expect(container.innerHTML).toContain('Route 226 canceled tonight');
		expect(container.querySelector('.alert-alert')).not.toBeNull();
	});

	// Punch list §2: the two most valuable positions on the board must not go to empty stops.
	test('sorts stops with departures ahead of empty and failed ones', () => {
		const live = arrival();
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [
					stop('1_empty'),
					stop('1_live', [live]),
					stop('1_failed', [], { failed: true }),
					stop('1_live2', [live])
				],
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		const cards = [...container.querySelectorAll('section')];
		const withRows = cards.map((c) => c.querySelectorAll('.route-badge').length > 0);
		expect(withRows).toEqual([true, true, false, false]);
	});

	test('preserves the configured order within the group that has departures', () => {
		const live = arrival();
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_100', [live]), stop('1_200'), stop('1_300', [live])],
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		const titles = [...container.querySelectorAll('[data-testid="stop-title"]')];
		expect(titles.map((el) => el.textContent.trim())).toEqual(['Stop 1_100', 'Stop 1_300']);
	});

	// Punch list §1: leftover panel height becomes bigger type, not a dead zone.
	test('grows rows above the 64px floor when the board is sparse', () => {
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_1', [arrival()]), stop('1_2', [arrival()])],
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		const row = container.querySelector('.route-badge').closest('[class^="status-"]');
		expect(parseInt(row.style.height, 10)).toBeGreaterThan(64);
	});

	// Punch list §16: a spine between the columns so unequal card heights do not drift apart.
	test('draws one column rule per gap', () => {
		const many = Array.from({ length: 4 }, () => arrival());
		const two = render(MultiStopBoard, {
			props: { stops: [stop('1_1', many), stop('1_2', many)], now, lastUpdatedAt: now.getTime() }
		});
		expect(two.container.querySelectorAll('[data-testid="column-rule"]').length).toBe(1);
		cleanup();
		const five = render(MultiStopBoard, {
			props: {
				stops: Array.from({ length: 5 }, (_, i) => stop(`1_${i}`, many)),
				now,
				lastUpdatedAt: now.getTime()
			}
		});
		expect(five.container.querySelectorAll('[data-testid="column-rule"]').length).toBe(2);
	});

	// Punch list §18: the mark and the wordmark were butted together with no separator.
	test('separates the logo from the agency name with a divider', () => {
		const { container } = render(MultiStopBoard, {
			props: {
				stops: [stop('1_1')],
				now,
				lastUpdatedAt: now.getTime(),
				agencyName: 'The Briar',
				agencyLogo: 'https://example.test/mark.svg'
			}
		});
		expect(container.querySelector('[data-testid="lockup-divider"]')).not.toBeNull();
	});

	test('omits the divider when there is no logo', () => {
		const { container } = render(MultiStopBoard, {
			props: { stops: [stop('1_1')], now, lastUpdatedAt: now.getTime(), agencyName: 'The Briar' }
		});
		expect(container.querySelector('[data-testid="lockup-divider"]')).toBeNull();
	});
});
