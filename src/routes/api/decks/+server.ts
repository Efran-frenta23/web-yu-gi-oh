import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/database';

const MAX_NAME = 100;
const MAX_DESC = 1000;
const MAX_MAIN = 60;
const MAX_EXTRA = 15;
const MAX_SIDE = 15;

function sanitizeCardIdArray(value: unknown, max: number): number[] {
	if (!Array.isArray(value)) return [];
	const ids: number[] = [];
	for (const v of value) {
		const n = typeof v === 'number' ? v : Number(v);
		if (Number.isInteger(n) && n > 0) ids.push(n);
		if (ids.length >= max) break;
	}
	return ids;
}

export async function POST({ request }) {
	let body: any;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const name = typeof body?.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
	if (!name) throw error(400, 'Deck name is required');

	const description =
		typeof body?.description === 'string' ? body.description.trim().slice(0, MAX_DESC) : null;

	const mainDeck = sanitizeCardIdArray(body?.mainDeck, MAX_MAIN);
	const extraDeck = sanitizeCardIdArray(body?.extraDeck, MAX_EXTRA);
	const sideDeck = sanitizeCardIdArray(body?.sideDeck, MAX_SIDE);

	const deck = await prisma.deck.create({
		data: { name, description, mainDeck, extraDeck, sideDeck }
	});

	return json({ success: true, deck });
}
