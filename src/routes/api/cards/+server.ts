import { json } from '@sveltejs/kit';
import type { Prisma } from '@prisma/client';
import prisma from '$lib/server/database';
import { cached, TTL } from '$lib/server/cache';

export async function GET({ url, setHeaders }) {
	const search = (url.searchParams.get('search') || '').trim().slice(0, 80);

	const where: Prisma.CardWhereInput = {};
	if (search) where.name = { contains: search };

	const cards = await cached(`search:${search}`, TTL.SHORT, () =>
		prisma.card.findMany({
			where,
			take: 20,
			include: { cardImages: true },
			orderBy: { id: 'asc' }
		})
	);

	setHeaders({ 'cache-control': 'public, max-age=30' });
	return json({ cards });
}
