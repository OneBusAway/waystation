import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDateTime, formatTime, formatDate, formatCurrentTime } from '$lib/formatters';

describe('Formatter Utilities', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('formatDateTime', () => {
		it('formats time with hours, minutes, and seconds', () => {
			const date = new Date(2023, 0, 1, 13, 45, 30);
			const formattedTime = formatDateTime(date);
			expect(formattedTime).toBe('1:45:30 PM');
		});

		it('handles midnight (12 AM) correctly', () => {
			const date = new Date(2023, 0, 1, 0, 5, 15);
			const formattedTime = formatDateTime(date);
			expect(formattedTime).toBe('12:05:15 AM');
		});

		it('handles noon (12 PM) correctly', () => {
			const date = new Date(2023, 0, 1, 12, 0, 0);
			const formattedTime = formatDateTime(date);
			expect(formattedTime).toBe('12:00:00 PM');
		});
	});

	describe('formatTime', () => {
		it('formats time with hours and minutes only (no seconds)', () => {
			const date = new Date(2023, 0, 1, 13, 45, 30);
			const formattedTime = formatTime(date);
			expect(formattedTime).toBe('1:45 PM');
		});

		it('handles midnight (12 AM) correctly', () => {
			const date = new Date(2023, 0, 1, 0, 5, 15);
			const formattedTime = formatTime(date);
			expect(formattedTime).toBe('12:05 AM');
		});

		it('handles noon (12 PM) correctly', () => {
			const date = new Date(2023, 0, 1, 12, 0, 0);
			const formattedTime = formatTime(date);
			expect(formattedTime).toBe('12:00 PM');
		});

		it('accepts string date input', () => {
			const dateStr = '2023-01-01T13:45:30';
			const formattedTime = formatTime(dateStr);
			expect(formattedTime).toBe('1:45 PM');
		});
	});

	describe('formatDate', () => {
		it('formats date with weekday, month, and day', () => {
			const date = new Date(2023, 0, 1);
			const formattedDate = formatDate(date);
			expect(formattedDate).toBe('Sunday, January 1');
		});

		it('formats dates at different times the same', () => {
			const date1 = new Date(2023, 2, 15, 9, 30);
			const date2 = new Date(2023, 2, 15, 18, 45);

			expect(formatDate(date1)).toBe(formatDate(date2));
			expect(formatDate(date1)).toBe('Wednesday, March 15');
		});
	});

	describe('formatCurrentTime', () => {
		it('formats current time with hours, minutes, and seconds using 2-digit format', () => {
			const date = new Date(2023, 0, 1, 9, 5, 7);
			const formattedTime = formatCurrentTime(date);
			expect(formattedTime).toBe('09:05:07 AM');
		});

		it('formats time with leading zeros for single-digit hours', () => {
			const date = new Date(2023, 0, 1, 9, 5, 7);
			const formattedTime = formatCurrentTime(date);
			expect(formattedTime).toBe('09:05:07 AM');
		});

		it('formats time with leading zeros for single-digit minutes and seconds', () => {
			const date = new Date(2023, 0, 1, 12, 1, 2);
			const formattedTime = formatCurrentTime(date);
			expect(formattedTime).toBe('12:01:02 PM');
		});
	});

	describe('locale behavior', () => {
		it('uses en-US locale for all formatting functions', () => {
			const date = new Date(2023, 0, 1, 13, 45, 30);

			const timeStringSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString');
			const dateStringSpy = vi.spyOn(Date.prototype, 'toLocaleDateString');

			formatDateTime(date);
			expect(timeStringSpy).toHaveBeenCalledWith('en-US', expect.anything());

			formatTime(date);
			expect(timeStringSpy).toHaveBeenCalledWith('en-US', expect.anything());

			formatDate(date);
			expect(dateStringSpy).toHaveBeenCalledWith('en-US', expect.anything());

			formatCurrentTime(date);
			expect(timeStringSpy).toHaveBeenCalledWith('en-US', expect.anything());
		});
	});
});
