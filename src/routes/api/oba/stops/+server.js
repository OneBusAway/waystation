import oba from '$lib/obaSdk.js';
import { stopIDs } from '$lib/dataStore';
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
    const stopID = stopIDs()[0]; 
    const response = await oba.stop.retrieve(stopID);
    return json({
        name: response.data.entry.name,
        code: response.data.entry.code
    });
}