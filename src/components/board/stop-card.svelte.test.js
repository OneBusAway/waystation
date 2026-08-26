import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, afterEach } from 'vitest';
import StopCard from './stop-card.svelte';
import { COLLAPSED_CARD_HEIGHT } from '$lib/board-layout.js';

function arrival(overrides = {}) {
	return {
		route: '249',
		name: 'Route 249',
		dest: 'South Bellevue Station',
		min: 6,
		delta: 0,
		status: 'ONTIME',
		departureAt: Date.now() + 6 * 60000,
		tripId: `t-${Math.random()}`,
		...overrides
	};
}

function stop(overrides = {}) {
	return {
		id: '1_74443',
		code: '74443',
		name: '120th Ave NE & NE Spring Blvd - Bay 1',
		direction: 'N',
		arrivals: [arrival()],
		failed: false,
		...overrides
	};
}

describe('StopCard heading', () => {
	afterEach(() => cleanup());

	// Punch list §7: the bay belongs in the meta line, not the title.
	test('strips the bay from the title and folds it into the meta line', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		const title = container.querySelector('[data-testid="stop-title"]');
		const meta = container.querySelector('[data-testid="stop-meta"]');
		expect(title.textContent.trim()).toBe('120th Ave NE & NE Spring Blvd');
		expect(title.textContent).not.toContain('Bay');
		expect(meta.textContent).toContain('#74443');
		expect(meta.textContent).toContain('Bay 1');
		expect(meta.textContent).toContain('Northbound');
	});

	test('omits the bay separator when the stop has no bay', () => {
		const { container } = render(StopCard, {
			props: { stop: stop({ name: 'Pine St & 3rd Ave' }) }
		});
		const meta = container.querySelector('[data-testid="stop-meta"]');
		expect(meta.textContent).not.toContain('Bay');
		expect(meta.textContent).toContain('#74443');
		expect(meta.textContent).toContain('Northbound');
	});

	// Punch list §6: the title must clearly outrank its own rows (36px vs the row's 24px).
	test('sets the title well above the destination size', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		expect(container.querySelector('[data-testid="stop-title"]').style.fontSize).toBe('36px');
	});

	// Punch list §17: 0.18em at 13px turns the meta line into texture.
	test('sets meta tracking to 0.10em', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		expect(container.querySelector('[data-testid="stop-meta"]').style.letterSpacing).toBe('0.10em');
	});
});

describe('StopCard collapsed variant', () => {
	afterEach(() => cleanup());

	// Punch list §2: an empty stop must not occupy a full card in a prime position.
	test('collapses an empty stop to a single dim line with no fill', () => {
		const { container } = render(StopCard, { props: { stop: stop({ arrivals: [] }) } });
		const card = container.querySelector('section');
		expect(card.style.height).toBe(`${COLLAPSED_CARD_HEIGHT}px`);
		expect(card.style.background).toBe('transparent');
		expect(card.style.opacity).toBe('0.4');
		expect(card.textContent).toContain('120th Ave NE & NE Spring Blvd');
		expect(card.textContent).toContain('Bay 1');
		expect(card.textContent).toContain('Northbound');
		expect(card.textContent).toContain('No upcoming departures');
	});

	test('drops the letterspaced caps treatment on the collapsed line', () => {
		const { container } = render(StopCard, { props: { stop: stop({ arrivals: [] }) } });
		expect(container.querySelector('section').textContent).not.toContain('NO UPCOMING DEPARTURES');
	});

	test('collapses a failed stop but keeps it at full presence in the late tone', () => {
		const { container } = render(StopCard, {
			props: { stop: stop({ arrivals: [], failed: true }) }
		});
		const card = container.querySelector('section');
		expect(card.style.opacity).toBe('1');
		expect(card.textContent).toContain('DATA UNAVAILABLE');
	});

	test('gives a stop with departures a full card, not the collapsed line', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		const card = container.querySelector('section');
		expect(card.style.height).toBe('');
		expect(card.style.background).toBe('var(--bg-elev)');
		expect(card.querySelectorAll('.route-badge').length).toBe(1);
	});
});

describe('StopCard sizing', () => {
	afterEach(() => cleanup());

	test('passes the solver sizes down to its rows and caps them at the limit', () => {
		const arrivals = Array.from({ length: 5 }, () => arrival());
		const { container } = render(StopCard, {
			props: { stop: stop({ arrivals }), limit: 3, rowHeight: 88, numeralSize: 60 }
		});
		const rows = container.querySelectorAll('.route-badge');
		expect(rows.length).toBe(3);
		expect(container.querySelector('[data-testid="minutes"]').style.fontSize).toBe('60px');
	});

	test('uses the container radius and the card edge token', () => {
		const { container } = render(StopCard, { props: { stop: stop() } });
		const card = container.querySelector('section');
		expect(card.style.borderRadius).toBe('var(--radius-container)');
		expect(card.style.border).toBe('1px solid var(--card-edge)');
	});
});
