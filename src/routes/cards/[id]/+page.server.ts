import type { PageServerLoad } from './$types';
import prisma from '$lib/server/database';
import { cached, TTL } from '$lib/server/cache';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(404, 'Card not found');

	const card = await cached(`card:${id}`, TTL.LONG, () =>
		prisma.card.findUnique({
			where: { id },
			include: { cardImages: true, cardPrices: true }
		})
	);

	if (!card) throw error(404, 'Card not found');

	const cardPrice = card.cardPrices[0] || null;

	const relatedCards = card.archetype
		? await cached(`card:${id}:related`, TTL.LONG, () =>
				prisma.card.findMany({
					where: { archetype: card.archetype as string, id: { not: card.id } },
					include: { cardImages: true },
					take: 8
				})
			)
		: [];

	return { card, cardPrice, relatedCards };
};
