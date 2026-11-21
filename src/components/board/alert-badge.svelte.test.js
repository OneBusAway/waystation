import { render, cleanup, waitFor } from '@testing-library/svelte';
import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import AlertBadge from './alert-badge.svelte';

let mockLocale = 'de';
let mockTranslate = vi.fn();

vi.mock('$lib/paraglide/runtime.js', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		getLocale: () => mockLocale
	};
});

vi.mock('$lib/formatters.js', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		translate: (...args) => mockTranslate(...args)
	};
});

function deferred() {
	let resolve;
	const promise = new Promise((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

function situation(headline) {
	return {
		summary: { value: headline },
		severity: 'severe',
		activeWindows: []
	};
}

describe('AlertBadge translated headline', () => {
	beforeEach(() => {
		mockLocale = 'de';
		mockTranslate = vi.fn();
	});

	afterEach(() => cleanup());

	test('shows the new raw headline while its translation is pending after alert rotation', async () => {
		const firstTranslation = deferred();
		const secondTranslation = deferred();

		mockTranslate
			.mockReturnValueOnce(firstTranslation.promise)
			.mockReturnValueOnce(secondTranslation.promise);

		const { container, rerender } = render(AlertBadge, {
			props: { situation: situation('Alert A') }
		});
		const headline = () => container.querySelector('[data-testid="alert-headline"]');

		await waitFor(() => {
			expect(mockTranslate).toHaveBeenNthCalledWith(1, 'Alert A', 'de');
		});

		firstTranslation.resolve('Übersetzte Warnung A');
		await waitFor(() => {
			expect(headline().textContent).toBe('Übersetzte Warnung A');
		});

		await rerender({ situation: situation('Alert B') });
		await waitFor(() => {
			expect(mockTranslate).toHaveBeenNthCalledWith(2, 'Alert B', 'de');
		});

		await waitFor(() => {
			expect(headline().textContent).toBe('Alert B');
		});

		secondTranslation.resolve('Übersetzte Warnung B');
		await waitFor(() => {
			expect(headline().textContent).toBe('Übersetzte Warnung B');
		});
	});

	test('shows the new raw headline when its translation fails', async () => {
		const firstTranslation = deferred();

		mockTranslate
			.mockReturnValueOnce(firstTranslation.promise)
			.mockRejectedValueOnce(new Error('Translation failed'));

		const { container, rerender } = render(AlertBadge, {
			props: { situation: situation('Alert A') }
		});

		const headline = () => container.querySelector('[data-testid="alert-headline"]');

		firstTranslation.resolve('Übersetzte Warnung A');

		await waitFor(() => {
			expect(headline().textContent).toBe('Übersetzte Warnung A');
		});

		await rerender({ situation: situation('Alert B') });

		await waitFor(() => {
			expect(headline().textContent).toBe('Alert B');
		});
	});
});
