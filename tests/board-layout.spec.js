import { expect, test } from '@playwright/test';

const STOP_ID = '1_75403';

function buildObaResponse() {
	const now = Date.now();
	const occupancies = [
		'MANY_SEATS_AVAILABLE',
		'FEW_SEATS_AVAILABLE',
		'STANDING_ROOM_ONLY',
		'FULL',
		'MANY_SEATS_AVAILABLE'
	];

	return {
		code: 200,
		data: {
			entry: {
				stopId: STOP_ID,
				arrivalsAndDepartures: occupancies.map((occupancyStatus, i) => ({
					routeShortName: `${40 + i}`,
					routeLongName: `Downtown Express ${i + 1}`,
					tripHeadsign: `University District ${i + 1}`,
					scheduledDepartureTime: now + (i + 2) * 60_000,
					predictedDepartureTime: now + (i + 2) * 60_000,
					tripId: `trip-${i + 1}`,
					occupancyStatus
				}))
			},
			references: {
				stops: [
					{
						id: STOP_ID,
						code: '75403',
						name: '3rd Ave & Pike St'
					}
				],
				situations: [
					{
						id: 'sit-1',
						severity: 'alert',
						summary: {
							value: 'Route 40 detoured near Pike St due to construction'
						},
						activeWindows: [
							{
								from: now - 3_600_000,
								to: now + 3_600_000
							}
						]
					}
				]
			}
		}
	};
}

for (const rowCount of [4, 5]) {
	test(`single-stop board keeps all ${rowCount} rows within the rows container at 1920x1080`, async ({
		page,
		request
	}) => {
		const configRes = await request.post('/api/config', {
			data: {
				maxDepartures: rowCount,
				updateInterval: 1,
				theme: 'dark',
				colorMode: 'color',
				showCrowding: true
			}
		});
		expect(configRes.ok()).toBe(true);

		let shouldFail = false;
		await page.route(`**/api/oba/arrivals-and-departures-for-stop/${STOP_ID}`, async (route) => {
			if (!shouldFail) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(buildObaResponse())
				});
				return;
			}
			await route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({ message: 'Simulated upstream failure' })
			});
		});

		await page.goto(`/stops/${STOP_ID}`);

		const rowsContainer = page.locator('.departure-rows-container');
		await expect(rowsContainer).toBeVisible();
		await expect(rowsContainer.locator('.row')).toHaveCount(rowCount);
		await expect(rowsContainer.locator('[class*="occupancy-"]')).toHaveCount(rowCount);
		await expect(page.locator('.alert-badge')).toBeVisible();
		await expect(page.getByText(/UPDATED/i)).toBeVisible();
		shouldFail = true;
		await expect(page.getByText(/DATA UNAVAILABLE FOR STOP/i)).toBeVisible({
			timeout: 10_000
		});

		const measurements = await page.evaluate(async () => {
			await document.fonts.ready;
			const stage = document.getElementById('board-stage');
			const container = document.querySelector('.departure-rows-container');
			const containerRect = container.getBoundingClientRect();
			const rows = Array.from(container.querySelectorAll('.row')).map((row, index) => {
				const rowRect = row.getBoundingClientRect();
				let contentBottom = rowRect.bottom;
				for (const child of row.children) {
					contentBottom = Math.max(contentBottom, child.getBoundingClientRect().bottom);
				}
				return {
					index,
					rowTop: rowRect.top,
					rowBottom: rowRect.bottom,
					rowHeight: rowRect.height,
					contentBottom
				};
			});
			return {
				stageRect: stage.getBoundingClientRect().toJSON(),
				containerTop: containerRect.top,
				containerBottom: containerRect.bottom,
				containerHeight: containerRect.height,
				rows
			};
		});

		expect(measurements.stageRect.width).toBe(1920);
		expect(measurements.stageRect.height).toBe(1080);

		for (const row of measurements.rows) {
			expect(
				row.contentBottom,
				`Row ${row.index} content bottom (${row.contentBottom}) exceeded container bottom (${measurements.containerBottom})`
			).toBeLessThanOrEqual(measurements.containerBottom);
		}
	});
}
