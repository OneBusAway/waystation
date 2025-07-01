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
	removeDuplicates
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
			const date = new Date('2025-07-01');
			expect(formatDate(date)).toMatch(/Tuesday, July 1/);
		});

		test('formatCurrentTime includes full time with seconds', () => {
			const now = new Date('2025-07-01T09:15:30');
			expect(formatCurrentTime(now)).toMatch(/9:15:30 (AM|PM)/);
		});

		test('formatTimestamp gives readable short format', () => {
			const ts = new Date('2025-06-18').getTime();
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
});
