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
	parseStopDepartures,
	diffArrivals,
	alertTone,
	formatAlertWindow,
	splitStopName,
	formatOccupancy
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
			expect(result.stopName).toBe('STOP #75057');
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

	describe('diffArrivals', () => {
		function departure(overrides) {
			return {
				route: '49',
				name: 'Route 49',
				dest: 'Downtown',
				min: 5,
				delta: 0,
				status: 'ONTIME',
				stopName: '',
				departureAt: 1_000_000,
				tripId: 't1',
				...overrides
			};
		}

		test('keeps the previous reference when nothing rendered has changed', () => {
			const p = departure({});
			const n = departure({});
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(p);
		});

		test('uses the new reference when only min changes', () => {
			const p = departure({});
			const n = departure({ min: 4 });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
			expect(result).not.toBe(p);
		});

		test('uses the new reference when only status changes', () => {
			const p = departure({ status: 'ONTIME' });
			const n = departure({ status: 'LATE' });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
			expect(result).not.toBe(p);
		});

		test('uses the new reference when only delta changes', () => {
			const p = departure({ delta: 0 });
			const n = departure({ delta: 3 });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
			expect(result).not.toBe(p);
		});

		test('uses the new reference when only departureAt changes', () => {
			const p = departure({ departureAt: 1_000_000 });
			const n = departure({ departureAt: 1_060_000 });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
			expect(result).not.toBe(p);
		});

		test('passes through a new arrival with no match in the previous list', () => {
			const p = departure({ tripId: 't1' });
			const n = departure({ tripId: 't2' });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
		});

		test('uses the new reference when only route/name/dest/stopName change (headsign update, steady timing)', () => {
			const p = departure({ route: '49', name: 'Route 49', dest: 'Downtown', stopName: 'Main St' });
			const n = departure({ route: '49', name: 'Route 49', dest: 'Airport', stopName: 'Main St' });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
			expect(result).not.toBe(p);
			expect(result.dest).toBe('Airport');
		});

		test('uses the new reference when only route changes', () => {
			const p = departure({ route: '49' });
			const n = departure({ route: '50' });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
			expect(result).not.toBe(p);
			expect(result.route).toBe('50');
		});

		test('uses the new reference when only name changes', () => {
			const p = departure({ name: 'Route 49' });
			const n = departure({ name: 'Route 49 Express' });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
			expect(result).not.toBe(p);
			expect(result.name).toBe('Route 49 Express');
		});

		test('uses the new reference when only stopName changes', () => {
			const p = departure({ stopName: 'Main St' });
			const n = departure({ stopName: 'Main St & 5th Ave' });
			const [result] = diffArrivals([p], [n]);
			expect(result).toBe(n);
			expect(result).not.toBe(p);
			expect(result.stopName).toBe('Main St & 5th Ave');
		});
	});
});

describe('parseStopDepartures stop metadata', () => {
	test('exposes stop code and direction from the stop reference', () => {
		const json = {
			data: {
				entry: { arrivalsAndDepartures: [] },
				references: { stops: [{ id: '1_74439', code: '74439', direction: 'N', name: 'X' }] }
			}
		};
		const r = parseStopDepartures(json, '1_74439');
		expect(r.stopCode).toBe('74439');
		expect(r.direction).toBe('N');
	});

	test('falls back to the numeric id and empty direction when no stop reference exists', () => {
		const r = parseStopDepartures(null, 'MTS_75057');
		expect(r.stopCode).toBe('75057');
		expect(r.direction).toBe('');
	});

	test('falls back to the numeric id when the stop reference has an empty code', () => {
		const json = {
			data: {
				entry: { arrivalsAndDepartures: [] },
				references: { stops: [{ id: '1_74439', code: '', name: 'X' }] }
			}
		};
		expect(parseStopDepartures(json, '1_74439').stopCode).toBe('74439');
	});
});

describe('splitStopName', () => {
	test('lifts a hyphenated bay suffix out of the stop name', () => {
		expect(splitStopName('120th Ave NE & NE Spring Blvd - Bay 1')).toEqual({
			name: '120th Ave NE & NE Spring Blvd',
			bay: 'Bay 1'
		});
	});

	test('handles en dash and em dash separators', () => {
		expect(splitStopName('Main St – Bay 4').bay).toBe('Bay 4');
		expect(splitStopName('Main St — Bay 4').bay).toBe('Bay 4');
	});

	test('handles a parenthesised bay', () => {
		expect(splitStopName('Transit Center (Bay C)')).toEqual({
			name: 'Transit Center',
			bay: 'Bay C'
		});
	});

	test('normalises the word Bay but preserves the bay identifier', () => {
		expect(splitStopName('Depot - BAY D-3').bay).toBe('Bay D-3');
	});

	test('leaves a name with no bay untouched', () => {
		expect(splitStopName('Pine St & 3rd Ave')).toEqual({
			name: 'Pine St & 3rd Ave',
			bay: ''
		});
	});

	test('does not mistake a hyphenated place name for a bay', () => {
		expect(splitStopName('Bellevue - Downtown')).toEqual({
			name: 'Bellevue - Downtown',
			bay: ''
		});
	});

	test('tolerates missing or non-string input', () => {
		expect(splitStopName(undefined)).toEqual({ name: '', bay: '' });
		expect(splitStopName(null)).toEqual({ name: '', bay: '' });
	});
});

describe('formatAlertWindow', () => {
	test('drops the weekday and the year', () => {
		const result = formatAlertWindow(new Date('2026-08-18T12:00:00Z').getTime());
		expect(result).toContain('18');
		expect(result).not.toMatch(/2026/);
		expect(result).not.toMatch(/Tue|Tuesday/i);
	});
});

describe('alertTone', () => {
	test('maps the OBA severity vocabulary onto the three painted tones', () => {
		expect(alertTone('severe')).toBe('alert');
		expect(alertTone('verySevere')).toBe('alert');
		expect(alertTone('normal')).toBe('advisory');
		expect(alertTone('slight')).toBe('info');
		expect(alertTone('verySlight')).toBe('info');
		expect(alertTone('noImpact')).toBe('info');
	});

	test('passes through a value that is already a board tone', () => {
		expect(alertTone('info')).toBe('info');
		expect(alertTone('advisory')).toBe('advisory');
		expect(alertTone('alert')).toBe('alert');
	});

	test('is insensitive to case, spaces and separators', () => {
		expect(alertTone('VERY_SEVERE')).toBe('alert');
		expect(alertTone('very severe')).toBe('alert');
		expect(alertTone('very-severe')).toBe('alert');
	});

	// Regression: an unmapped value used to produce a class with no --alert-tone,
	// which is why the 6px severity bar never drew on the deployed board.
	test('falls back to advisory so a tone is always defined', () => {
		expect(alertTone('unknown')).toBe('advisory');
		expect(alertTone('')).toBe('advisory');
		expect(alertTone(undefined)).toBe('advisory');
		expect(alertTone(null)).toBe('advisory');
	});
});

describe('formatOccupancy', () => {
	test('buckets seat-available statuses as light', () => {
		expect(formatOccupancy('EMPTY')).toBe('LIGHT');
		expect(formatOccupancy('MANY_SEATS_AVAILABLE')).toBe('LIGHT');
	});

	test('buckets limited-seating statuses as medium', () => {
		expect(formatOccupancy('FEW_SEATS_AVAILABLE')).toBe('MEDIUM');
		expect(formatOccupancy('STANDING_ROOM_ONLY')).toBe('MEDIUM');
	});

	test('buckets statuses with no room to board comfortably as full', () => {
		expect(formatOccupancy('CRUSHED_STANDING_ROOM_ONLY')).toBe('FULL');
		expect(formatOccupancy('FULL')).toBe('FULL');
		expect(formatOccupancy('NOT_ACCEPTING_PASSENGERS')).toBe('FULL');
	});

	test('returns null for missing or unknown statuses so nothing renders', () => {
		expect(formatOccupancy(null)).toBeNull();
		expect(formatOccupancy(undefined)).toBeNull();
		expect(formatOccupancy('UNKNOWN')).toBeNull();
		expect(formatOccupancy('')).toBeNull();
		expect(formatOccupancy('full')).toBeNull();
	});
});
