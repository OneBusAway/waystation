// @vitest-environment jsdom

import { describe, test, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import {
	formatDateTime,
	formatTime,
	formatDate,
	formatCurrentTime,
	formatTimestamp,
	formatArrivalStatus,
	formatRouteStatus,
	formatBorderColor,
	formatShadowColor,
	formatTextColor,
	generateRandomID,
	sortEarliestDepartures,
	removeDuplicates,
	formatBoardDeparture,
	parseStopDepartures
} from '$lib/formatters';

afterEach(() => {
	cleanup();
});

describe('formatters', () => {
	describe('Time & Date Formatting', () => {
		test('formatDateTime includes seconds and meridiem', () => {
			const date = new Date('2025-07-01T12:34:56');
			expect(formatDateTime(date)).toMatch(/12:34:56 (AM|PM)/);
		});

		test('formatTime outputs hour and minute', () => {
			const time = new Date('2025-07-01T15:00:00');
			expect(formatTime(time)).toMatch(/3:00 (PM|AM)/);
		});

		test('formatDate includes weekday and full date', () => {
			const date = new Date('2025-07-01T00:00:00');
			expect(formatDate(date)).toMatch(/Tuesday, July 1/);
		});

		test('formatCurrentTime includes full time with seconds', () => {
			const now = new Date('2025-07-01T09:15:30');
			expect(formatCurrentTime(now)).toMatch(/9:15:30 (AM|PM)/);
		});

		test('formatTimestamp gives readable short format', () => {
			const ts = new Date('2025-06-18T00:00:00').getTime();
			expect(formatTimestamp(ts)).toMatch(/Wed, Jun 18, 2025/);
		});
	});

	describe('Arrival & Route Status', () => {
		test('formatArrivalStatus handles no prediction as Arriving', () => {
			const now = Date.now();
			const result = formatArrivalStatus(0, now + 5 * 60000);
			expect(result?.status).toBe('Arriving');
		});

		test('formatRouteStatus detects early arrival', () => {
			const scheduled = Date.now();
			const predicted = scheduled - 5 * 60000;
			const result = formatRouteStatus(predicted, scheduled);
			expect(result.status).toBe('early');
		});
	});

	describe('Styling Helpers', () => {
		test('formatBorderColor returns gray for Departing', () => {
			const result = formatBorderColor('Departing', 'late');
			expect(result.borderColor).toBe('border-brand-gray');
		});

		test('formatShadowColor returns red for early', () => {
			const result = formatShadowColor('Arriving', 'early');
			expect(result.shadowColor).toBe('var(--shadow-red)');
		});

		test('formatTextColor returns gray for unknown', () => {
			const result = formatTextColor('Arriving', 'unknown');
			expect(result.textColor).toBe('text-brand-gray');
		});
	});

	describe('Utilities', () => {
		test('generateRandomID creates unique ID with pattern', () => {
			const id = generateRandomID('trip1', 'stop2');
			expect(id).toMatch(/trip1-stop2-\d+/);
		});

		test('sortEarliestDepartures returns sorted list', () => {
			const deps = [
				{ predictedDepartureTime: 3000 },
				{ scheduledDepartureTime: 1000 },
				{ predictedDepartureTime: 2000 }
			];
			const sorted = sortEarliestDepartures(deps);
			expect(sorted[0].scheduledDepartureTime).toBe(1000);
		});

		test('sortEarliestDepartures keeps scheduled-only departures (predictedDepartureTime === 0)', () => {
			const deps = [
				{ predictedDepartureTime: 0, scheduledDepartureTime: 3000 },
				{ predictedDepartureTime: 0, scheduledDepartureTime: 1000 },
				{ predictedDepartureTime: 0, scheduledDepartureTime: 2000 }
			];
			const sorted = sortEarliestDepartures(deps);
			expect(sorted.length).toBe(3);
			expect(sorted[0].scheduledDepartureTime).toBe(1000);
			expect(sorted[2].scheduledDepartureTime).toBe(3000);
		});

		test('removeDuplicates filters duplicates correctly', () => {
			const deps = [
				{ tripId: '1', scheduledDepartureTime: 1000 },
				{ tripId: '1', scheduledDepartureTime: 1000 },
				{ tripId: '2', scheduledDepartureTime: 2000 }
			];
			const filtered = removeDuplicates(deps);
			expect(filtered.length).toBe(2);
		});
	});

	describe('formatBoardDeparture', () => {
		const NOW = new Date('2026-05-26T17:00:00');
		const baseDep = {
			routeShortName: '30',
			routeLongName: 'Old Town – UTC',
			tripHeadsign: 'UTC',
			tripId: 'MTS_abc',
			scheduledDepartureTime: NOW.getTime() + 5 * 60_000
		};

		test('marks CANCEL when tripStatus.status is CANCELED, regardless of predicted time', () => {
			const dep = {
				...baseDep,
				predictedDepartureTime: NOW.getTime() + 5 * 60_000,
				tripStatus: { status: 'CANCELED' }
			};
			const a = formatBoardDeparture(dep, NOW);
			expect(a.status).toBe('CANCEL');
			expect(a.delta).toBeNull();
		});

		test('returns SCHED when predicted is 0 (no realtime data)', () => {
			const dep = { ...baseDep, predictedDepartureTime: 0 };
			const a = formatBoardDeparture(dep, NOW);
			expect(a.status).toBe('SCHED');
			expect(a.delta).toBeNull();
			expect(a.departureAt).toBe(baseDep.scheduledDepartureTime);
		});

		test('returns SCHED when predicted is undefined', () => {
			const dep = { ...baseDep };
			const a = formatBoardDeparture(dep, NOW);
			expect(a.status).toBe('SCHED');
		});

		test('marks EARLY at the delta=-1 boundary', () => {
			const dep = {
				...baseDep,
				predictedDepartureTime: baseDep.scheduledDepartureTime - 60_000
			};
			const a = formatBoardDeparture(dep, NOW);
			expect(a.status).toBe('EARLY');
			expect(a.delta).toBe(-1);
		});

		test('marks LATE at the delta=1 boundary', () => {
			const dep = {
				...baseDep,
				predictedDepartureTime: baseDep.scheduledDepartureTime + 60_000
			};
			const a = formatBoardDeparture(dep, NOW);
			expect(a.status).toBe('LATE');
			expect(a.delta).toBe(1);
		});

		test('marks ONTIME when delta rounds to 0', () => {
			const dep = {
				...baseDep,
				predictedDepartureTime: baseDep.scheduledDepartureTime + 20_000
			};
			const a = formatBoardDeparture(dep, NOW);
			expect(a.status).toBe('ONTIME');
			expect(a.delta).toBe(0);
		});

		test('min uses Math.floor for departures in the past', () => {
			const dep = {
				...baseDep,
				scheduledDepartureTime: NOW.getTime() - 90_000,
				predictedDepartureTime: NOW.getTime() - 90_000
			};
			const a = formatBoardDeparture(dep, NOW);
			expect(a.min).toBe(-2);
		});

		test('falls back to ? for missing route and to tripHeadsign for missing routeLongName', () => {
			const dep = { tripHeadsign: 'Downtown', scheduledDepartureTime: NOW.getTime() + 60_000 };
			const a = formatBoardDeparture(dep, NOW);
			expect(a.route).toBe('?');
			expect(a.name).toBe('Downtown');
			expect(a.dest).toBe('Downtown');
		});

		test('falls back to ? for empty routeShortName', () => {
			const dep = { ...baseDep, routeShortName: '' };
			const a = formatBoardDeparture(dep, NOW).route;
			expect(a).toBe('?');
		});

		test('produces a finite min (not NaN) when both timestamps are missing', () => {
			const dep = { routeShortName: '99', tripHeadsign: 'Nowhere' };
			const a = formatBoardDeparture(dep, NOW);
			expect(Number.isNaN(a.min)).toBe(false);
			expect(a.min).toBeLessThan(-2);
		});
	});

	describe('parseStopDepartures', () => {
		const validResponse = {
			data: {
				references: {
					stops: [{ id: 'MTS_75057', name: 'Stadium Station' }],
					situations: [{ summary: { value: 'Detour' } }]
				},
				entry: {
					arrivalsAndDepartures: [
						{ tripId: 'MTS_1', routeShortName: '530' },
						{ tripId: 'MTS_2', routeShortName: '530' }
					]
				}
			}
		};

		test('returns an empty result without throwing when the response is null', () => {
			// Upstream OBA returns the literal body `null` (HTTP 200) for some valid
			// stops with no available real-time data, e.g. MTS_75057.
			const result = parseStopDepartures(null, 'MTS_75057');
			expect(result.stopId).toBe('MTS_75057');
			expect(result.departures).toEqual([]);
			expect(result.situations).toEqual([]);
			expect(result.stale).toBe(false);
		});

		test('falls back to "Stop #<code>" for the name when references are absent', () => {
			const result = parseStopDepartures(null, 'MTS_75057');
			expect(result.stopName).toBe('Stop #75057');
		});

		test('resolves the stop name and attaches it to each departure', () => {
			const result = parseStopDepartures(validResponse, 'MTS_75057');
			expect(result.stopName).toBe('Stadium Station');
			expect(result.departures).toHaveLength(2);
			expect(result.departures[0].stopName).toBe('Stadium Station');
			expect(result.departures[0].tripId).toBe('MTS_1');
			expect(result.situations).toHaveLength(1);
		});

		test('returns an empty departures list (with resolved name) for a valid stop with no departures', () => {
			const response = {
				data: {
					references: { stops: [{ id: 'MTS_75057', name: 'Stadium Station' }] },
					entry: { arrivalsAndDepartures: [] }
				}
			};
			const result = parseStopDepartures(response, 'MTS_75057');
			expect(result.departures).toEqual([]);
			expect(result.stopName).toBe('Stadium Station');
		});

		test('passes through the stale flag', () => {
			const result = parseStopDepartures({ ...validResponse, stale: true }, 'MTS_75057');
			expect(result.stale).toBe(true);
		});
	});
});
