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

	test('does not render when title is missing, even if a description exists', () => {
		const { container } = render(Alerts, {
			props: { situations: [{}] }
		});

		expect(container.innerHTML).toBe('<!---->');
	});
});
