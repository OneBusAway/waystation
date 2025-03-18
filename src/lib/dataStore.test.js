import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { routesForStopID } from './dataStore';

vi.mock('$env/static/private', () => {
	return {
		PRIVATE_DEPARTURES: JSON.stringify([
			{
				id: 'stop1',
				routes: ['route1', 'route2']
			},
			{
				id: 'stop2',
				routes: ['route3', 'route4', 'route5']
			},
			{
				id: 'stop3',
				routes: []
			}
		])
	};
});

describe('Departures Utilities', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('routesForStopID', () => {
		it('returns routes for a valid stop ID', () => {
			const routes = routesForStopID('stop1');
			expect(routes).toEqual(['route1', 'route2']);
		});

		it('returns multiple routes for a stop with many routes', () => {
			const routes = routesForStopID('stop2');
			expect(routes).toEqual(['route3', 'route4', 'route5']);
			expect(routes.length).toBe(3);
		});

		it('returns an empty array for a stop with no routes', () => {
			const routes = routesForStopID('stop3');
			expect(routes).toEqual([]);
			expect(routes.length).toBe(0);
		});

		it('throws an error for a non-existent stop ID', () => {
			expect(() => routesForStopID('nonexistent')).toThrow();
		});
	});

	describe('caching behavior', () => {
		it('uses cached values on subsequent calls', () => {
			// First call should parse PRIVATE_DEPARTURES
			const routes1 = routesForStopID('stop1');

			// Mock to verify we don't parse JSON again
			const jsonSpy = vi.spyOn(JSON, 'parse');

			// Second call should use cache
			const routes2 = routesForStopID('stop1');

			expect(routes1).toEqual(routes2);
			expect(jsonSpy).not.toHaveBeenCalled();
		});
	});
});
