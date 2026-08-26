import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import AlertBand from './alert-band.svelte';
import { ALERT_HEIGHT } from '$lib/board-layout.js';

const HEADLINE =
	'Starting Monday, several routes serving downtown will have changes ranging from minor stop relocations to full reroutes';
const BODY = 'Check the agency website for the full list of affected trips.';

function situation(overrides = {}) {
	return {
		summary: { value: HEADLINE },
		description: { value: BODY },
		severity: 'severe',
		activeWindows: [
			{
				from: new Date('2026-08-18T12:00:00Z').getTime(),
				to: new Date('2026-09-05T12:00:00Z').getTime()
			}
		],
		...overrides
	};
}

describe('AlertBand content', () => {
	afterEach(() => cleanup());

	// Punch list §5: the headline was single-line clipped and the body never rendered.
	test('clamps the headline to two lines rather than one', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		const headline = container.querySelector('[data-testid="alert-headline"]');
		expect(headline.textContent).toContain('ranging from');
		expect(
			headline.style.webkitLineClamp || headline.style.getPropertyValue('-webkit-line-clamp')
		).toBe('2');
	});

	test('renders the body below the headline', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		const body = container.querySelector('[data-testid="alert-body"]');
		expect(body).not.toBeNull();
		expect(body.textContent).toContain('affected trips');
	});

	test('omits the body element when the situation has no description', () => {
		const { container } = render(AlertBand, {
			props: { situation: situation({ description: undefined }) }
		});
		expect(container.querySelector('[data-testid="alert-body"]')).toBeNull();
	});

	// Punch list §5: SERVICE ADVISORY becomes a left-aligned eyebrow above the headline.
	test('places SERVICE ADVISORY above the headline as an eyebrow, not in the right rail', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		const eyebrow = container.querySelector('[data-testid="alert-eyebrow"]');
		const rail = container.querySelector('[data-testid="alert-window"]');
		expect(eyebrow.textContent).toContain('SERVICE ADVISORY');
		expect(rail.textContent).not.toContain('SERVICE ADVISORY');
	});

	// Punch list §5: the header already says the year and today's date.
	test('shows the date window without weekday or year', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		const rail = container.querySelector('[data-testid="alert-window"]').textContent;
		expect(rail).toContain('Aug 18');
		expect(rail).toContain('Sep 5');
		expect(rail).not.toMatch(/2026/);
		expect(rail).not.toMatch(/Tue|Sat/i);
	});

	test('renders nothing in the rail when the situation has no active window', () => {
		const { container } = render(AlertBand, {
			props: { situation: situation({ activeWindows: [] }) }
		});
		expect(container.querySelector('[data-testid="alert-window"]').textContent.trim()).toBe('');
	});
});

describe('AlertBand severity', () => {
	afterEach(() => cleanup());

	// Regression: OBA severity values never matched the three tone classes, so the 6px
	// severity bar and the background tint never drew on the deployed board.
	test('maps an OBA severity onto a tone class the stylesheet defines', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		expect(container.querySelector('.alert-alert')).not.toBeNull();
	});

	test('maps a low severity to the info tone', () => {
		const { container } = render(AlertBand, {
			props: { situation: situation({ severity: 'slight' }) }
		});
		expect(container.querySelector('.alert-info')).not.toBeNull();
	});

	test('always lands on a defined tone for an unknown severity', () => {
		const { container } = render(AlertBand, {
			props: { situation: situation({ severity: 'somethingNew' }) }
		});
		expect(container.querySelector('.alert-advisory')).not.toBeNull();
	});
});

describe('AlertBand geometry', () => {
	afterEach(() => cleanup());

	test('is exactly the height the layout solver reserves for it', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		expect(container.firstElementChild.style.height).toBe(`${ALERT_HEIGHT}px`);
	});

	test('uses the container radius on the band and the chip radius on the glyph box', () => {
		const { container } = render(AlertBand, { props: { situation: situation() } });
		expect(container.firstElementChild.style.borderRadius).toBe('var(--radius-container)');
		expect(container.querySelector('.alert-glyph').style.borderRadius).toBe('var(--radius-chip)');
	});
});
