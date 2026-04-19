import type { PageServerLoad } from './$types';
import prisma from '$lib/server/database';

export const load: PageServerLoad = async () => {
	const decks = await prisma.deck.findMany({
		orderBy: { createdAt: 'desc' },
		take: 50,
	});

	return {
		decks,
	};
};
