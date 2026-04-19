import type { PageServerLoad } from './$types';
import type { Prisma } from '@prisma/client';
import prisma from '$lib/server/database';
import { cached, TTL } from '$lib/server/cache';

const PAGE_SIZE = 24;
const MAX_PAGE = 500;

function clean(s: string | null, max = 80) {
	if (!s) return '';
	return s.trim().slice(0, max);
}

export const load: PageServerLoad = async ({ url }) => {
	const pageRaw = parseInt(url.searchParams.get('page') || '1');
	const page = Math.min(Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1), MAX_PAGE);
	const search = clean(url.searchParams.get('search'));
	const type = clean(url.searchParams.get('type'));
	const attribute = clean(url.searchParams.get('attribute'), 50);
	const archetype = clean(url.searchParams.get('archetype'), 100);
	const race = clean(url.searchParams.get('race'), 100);

	const where: Prisma.CardWhereInput = {};
	if (search) where.name = { contains: search };
	if (type) where.type = { contains: type };
	if (attribute) where.attribute = attribute;
	if (archetype) where.archetype = archetype;
	if (race) where.race = race;

	const hasFilters = !!(search || type || attribute || archetype || race);

	const listKey = `cards:list:${page}:${search}:${type}:${attribute}:${archetype}:${race}`;
	const countKey = `cards:count:${search}:${type}:${attribute}:${archetype}:${race}`;

	const [cards, totalCards, filterOptions] = await Promise.all([
		cached(listKey, hasFilters ? TTL.SHORT : TTL.DEFAULT, () =>
			prisma.card.findMany({
				where,
				take: PAGE_SIZE,
				skip: (page - 1) * PAGE_SIZE,
				include: { cardImages: true },
				orderBy: { id: 'asc' }
			})
		),
		cached(countKey, hasFilters ? TTL.SHORT : TTL.LONG, () => prisma.card.count({ where })),
		cached('cards:filters', TTL.LONG, async () => {
			const [types, attrs, races, archetypes] = await Promise.all([
				prisma.card.groupBy({
					by: ['type'],
					_count: { type: true },
					orderBy: { _count: { type: 'desc' } },
					take: 20
				}),
				prisma.card.groupBy({
					by: ['attribute'],
					where: { attribute: { not: null } },
					_count: { attribute: true },
					orderBy: { _count: { attribute: 'desc' } }
				}),
				prisma.card.groupBy({
					by: ['race'],
					_count: { race: true },
					orderBy: { _count: { race: 'desc' } },
					take: 30
				}),
				prisma.card.groupBy({
					by: ['archetype'],
					where: { archetype: { not: null } },
					_count: { archetype: true },
					orderBy: { _count: { archetype: 'desc' } },
					take: 200
				})
			]);
			return {
				cardTypes: types.map((t) => t.type),
				attributes: attrs.map((a) => a.attribute as string).filter(Boolean),
				races: races.map((r) => r.race),
				archetypes: archetypes.map((a) => a.archetype as string).filter(Boolean)
			};
		})
	]);

	const totalPages = Math.max(1, Math.ceil(totalCards / PAGE_SIZE));

	return {
		cards,
		totalCards,
		totalPages,
		page,
		search,
		type,
		attribute,
		archetype,
		race,
		...filterOptions
	};
};
