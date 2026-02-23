// @vitest-environment jsdom

import { render, cleanup, waitFor } from '@testing-library/svelte';
import { expect, test, describe, afterEach } from 'vitest';
import Alerts from './alerts.svelte';
import * as t from '$lib/paraglide/messages.js';

describe('Alerts component in displayMode (sidebar mode)', () => {
	afterEach(() => {
		cleanup();
	});

	test('renders alert with equal valid start and end dates', async () => {
		const { getByText, queryByText, container } = render(Alerts, {
			props: {
				situation: {
					summary: { value: 'Test Alert Title' },
					activeWindows: [{ from: 1718948400000, to: 1718948400000 }]
				},
				displayMode: true
			}
		});

		await waitFor(() => {
			expect(getByText(t.alerts_disclaimer())).toBeTruthy();
			expect(getByText('Test Alert Title')).toBeTruthy();
			expect(getByText(t.alerts_on())).toBeTruthy();
			expect(container.innerHTML).not.toContain('➔');
			expect(queryByText(t.alerts_starting())).toBeNull();
			expect(queryByText(t.alerts_ending())).toBeNull();
		});
	});

	test('renders alert with only start date', async () => {
		const { getByText, queryByText, container } = render(Alerts, {
			props: {
				situation: {
					summary: { value: 'Test Alert Title' },
					activeWindows: [{ from: 1718948400000 }]
				},
				displayMode: true
			}
		});

		await waitFor(() => {
			expect(getByText(t.alerts_starting())).toBeTruthy();
			expect(queryByText(t.alerts_ending())).toBeNull();
			expect(container.innerHTML).not.toContain('➔');
		});
	});

	test('renders alert with only end date', async () => {
		const { getByText, queryByText, container } = render(Alerts, {
			props: {
				situation: {
					summary: { value: 'Test Alert Title' },
					activeWindows: [{ to: 1718952000000 }]
				},
				displayMode: true
			}
		});

		await waitFor(() => {
			expect(queryByText(t.alerts_starting())).toBeNull();
			expect(getByText(t.alerts_ending())).toBeTruthy();
			expect(container.innerHTML).not.toContain('➔');
		});
	});

	test('renders alert with both valid but different dates', async () => {
		const { getByText, container } = render(Alerts, {
			props: {
				situation: {
					summary: { value: 'Test Alert Title' },
					activeWindows: [{ from: 1718948400000, to: 1318952000000 }]
				},
				displayMode: true
			}
		});

		await waitFor(() => {
			expect(getByText(t.alerts_starting())).toBeTruthy();
			expect(getByText(t.alerts_ending())).toBeTruthy();
			expect(container.textContent).toContain('➔');
		});
	});

	test('does not render any date-related text for invalid timestamps', async () => {
		const { queryByText, container } = render(Alerts, {
			props: {
				situation: {
					summary: { value: 'Test Alert Title' },
					activeWindows: [{ from: 'invalid', to: 'invalid' }]
				},
				displayMode: true
			}
		});

		await waitFor(() => {
			expect(queryByText(t.alerts_on())).toBeNull();
			expect(queryByText(t.alerts_starting())).toBeNull();
			expect(queryByText(t.alerts_ending())).toBeNull();
			expect(container.innerHTML).not.toContain('➔');
		});
	});
});
