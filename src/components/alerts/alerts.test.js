// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { expect, test, describe } from 'vitest';
import Alerts from './alerts.svelte';

describe('Alerts component', () => {
	test('renders nothing when no alerts exist', () => {
		const { container } = render(Alerts, { props: { situations: [] } });
		expect(container.innerHTML).not.toContain('SCHEDULED');
	});

	test('renders successfully with alert data', () => {
		const { container } = render(Alerts, {
			props: {
				situations: [
					{
						summary: { value: 'Test Alert Title' },
						description: { value: 'Test Alert Description' }
					}
				]
			}
		});

		expect(container.textContent).toContain('SCHEDULEDMAINTENANCE');
		expect(container.textContent).toContain('Test Alert Title');
		expect(container.textContent).toContain('Test Alert Description');
		expect(container.innerHTML).toContain('bg-gradient-to-r');
	});

	test('renders with empty strings when summary or/and description are missing', () => {
		const { container } = render(Alerts, {
			props: { situations: [{}] }
		});

		const heading = container.querySelector('h2');
		expect(heading).toBeTruthy();
		expect(heading.textContent.replace(/\s/g, '')).toBe('SCHEDULEDMAINTENANCE');

		const titleDiv = container.querySelector('.mb-3.text-2xl.font-extrabold.text-white');
		const descDiv = container.querySelector('.text-lg.font-normal.text-white');

		expect(titleDiv?.textContent.trim()).toBe('');
		expect(descDiv?.textContent.trim()).toBe('');
	});
});
