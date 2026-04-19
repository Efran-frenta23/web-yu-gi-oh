import type { PageServerLoad } from './$types';
import prisma from '$lib/server/database';
import { cached, TTL } from '$lib/server/cache';

export const load: PageServerLoad = async () => {
	const [featuredCards, stats, popularArchetypes] = await Promise.all([
		cached('home:featured', TTL.DEFAULT, () =>
			prisma.card.findMany({
				take: 12,
				orderBy: { id: 'asc' },
				include: { cardImages: true }
			})
		),
		cached('home:stats', TTL.LONG, async () => {
			const [totalCards, totalMonsters, totalSpells, totalTraps] = await Promise.all([
				prisma.card.count(),
				prisma.card.count({ where: { type: { contains: 'Monster' } } }),
				prisma.card.count({ where: { type: { contains: 'Spell' } } }),
				prisma.card.count({ where: { type: { contains: 'Trap' } } })
			]);
			return { totalCards, totalMonsters, totalSpells, totalTraps };
		}),
		cached('home:archetypes', TTL.LONG, async () => {
			const rows = await prisma.card.groupBy({
				by: ['archetype'],
				where: { archetype: { not: null } },
				orderBy: { _count: { archetype: 'desc' } },
				take: 20
			});
			return rows.map((r) => r.archetype as string).filter(Boolean);
		})
	]);

	return { featuredCards, stats, popularArchetypes };
};
