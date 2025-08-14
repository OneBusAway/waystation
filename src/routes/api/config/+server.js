import { json } from '@sveltejs/kit';
import { saveConfig, getConfig } from '$lib/config/config.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	return json(getConfig());
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const res = await request.json();
	saveConfig(res);
	return json({ success: true });
}
