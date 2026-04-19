import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7';

interface YGOCard {
	id: number;
	name: string;
	type: string;
	frameType: string;
	desc: string;
	race: string;
	archetype?: string;
	atk?: number;
	def?: number;
	level?: number;
	attribute?: string;
	card_images: { image_url: string; image_url_small: string; image_url_cropped: string }[];
	card_prices: {
		cardmarket_price: string | number;
		tcgplayer_price: string | number;
		ebay_price: string | number;
		amazon_price: string | number;
		coolstuffinc_price: string | number;
	}[];
}

type SyncMode = { kind: 'full' } | { kind: 'incremental'; sinceDays: number };

function parseArgs(argv: string[]): SyncMode {
	const sinceArg = argv.find((a) => a.startsWith('--since='));
	if (!sinceArg) return { kind: 'full' };
	const raw = sinceArg.slice('--since='.length).trim();
	const match = raw.match(/^(\d+)\s*d$/i);
	const days = match ? Number(match[1]) : Number(raw);
	if (!Number.isFinite(days) || days <= 0) {
		throw new Error(`Invalid --since value: ${raw}`);
	}
	return { kind: 'incremental', sinceDays: days };
}

function toFloat(v: string | number | undefined): number {
	if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
	if (typeof v === 'string') {
		const n = parseFloat(v);
		return Number.isFinite(n) ? n : 0;
	}
	return 0;
}

async function fetchJson<T>(url: string, maxRetries = 3): Promise<T> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const res = await fetch(url);
			if (!res.ok) {
				if (res.status === 400) throw new Error('BAD_REQUEST');
				throw new Error(`HTTP ${res.status} ${res.statusText}`);
			}
			return (await res.json()) as T;
		} catch (err) {
			lastError = err;
			if ((err as Error).message === 'BAD_REQUEST') throw err;
			if (attempt < maxRetries) {
				const delay = 500 * attempt;
				console.warn(`Fetch failed (${attempt}/${maxRetries}), retrying in ${delay}ms...`);
				await new Promise((r) => setTimeout(r, delay));
			}
		}
	}
	throw lastError;
}

async function fetchAllCards(mode: SyncMode): Promise<YGOCard[]> {
	if (mode.kind === 'incremental') {
		const url = `${API_BASE_URL}/cardinfo.php?dateregion=${mode.sinceDays}`;
		console.log(`Fetching cards updated in last ${mode.sinceDays} days...`);
		try {
			const data = await fetchJson<{ data?: YGOCard[] }>(url);
			return data.data ?? [];
		} catch (err) {
			if ((err as Error).message === 'BAD_REQUEST') {
				console.log('No recent changes.');
				return [];
			}
			throw err;
		}
	}

	const all: YGOCard[] = [];
	let page = 1;
	const pageSize = 100;

	while (true) {
		console.log(`Fetching page ${page}...`);
		try {
			const data = await fetchJson<{ data?: YGOCard[] }>(
				`${API_BASE_URL}/cardinfo.php?num=${pageSize}&offset=${(page - 1) * pageSize}`
			);
			const rows = data.data ?? [];
			all.push(...rows);
			if (rows.length < pageSize) break;
			page++;
			await new Promise((r) => setTimeout(r, 200));
		} catch (err) {
			if ((err as Error).message === 'BAD_REQUEST') break;
			throw err;
		}
	}
	return all;
}

async function upsertCard(card: YGOCard) {
	const base = {
		name: card.name,
		type: card.type,
		frameType: card.frameType,
		desc: card.desc,
		race: card.race,
		archetype: card.archetype || null,
		atk: card.atk ?? null,
		def: card.def ?? null,
		level: card.level ?? null,
		attribute: card.attribute ?? null
	};

	await prisma.card.upsert({
		where: { id: card.id },
		update: base,
		create: { id: card.id, ...base }
	});

	const main = card.card_images?.[0];
	if (main) {
		if (main.image_url_small) {
			await prisma.cardImage.upsert({
				where: { cardId_imageType: { cardId: card.id, imageType: 'small' } },
				update: { imageUrl: main.image_url_small },
				create: { cardId: card.id, imageType: 'small', imageUrl: main.image_url_small }
			});
		}
		if (main.image_url) {
			await prisma.cardImage.upsert({
				where: { cardId_imageType: { cardId: card.id, imageType: 'large' } },
				update: { imageUrl: main.image_url },
				create: { cardId: card.id, imageType: 'large', imageUrl: main.image_url }
			});
		}
	}

	const p = card.card_prices?.[0];
	if (p) {
		const priceData = {
			cardmarket: toFloat(p.cardmarket_price),
			tcgplayer: toFloat(p.tcgplayer_price),
			ebay: toFloat(p.ebay_price),
			amazon: toFloat(p.amazon_price),
			coolstuffinc: toFloat(p.coolstuffinc_price)
		};
		await prisma.cardPrice.upsert({
			where: { cardId: card.id },
			update: priceData,
			create: { cardId: card.id, ...priceData }
		});
	}
}

async function sync() {
	const mode = parseArgs(process.argv.slice(2));
	console.log(`Starting sync (${mode.kind})...`);

	try {
		const cards = await fetchAllCards(mode);
		console.log(`Fetched ${cards.length} cards`);
		if (cards.length === 0) return;

		const concurrency = 8;
		let done = 0;
		const queue = [...cards];

		async function worker() {
			while (queue.length > 0) {
				const card = queue.shift();
				if (!card) return;
				try {
					await upsertCard(card);
				} catch (err) {
					console.error(`Failed upserting card ${card.id} (${card.name}):`, err);
				}
				done++;
				if (done % 500 === 0) console.log(`  ${done}/${cards.length}`);
			}
		}

		await Promise.all(Array.from({ length: concurrency }, () => worker()));
		console.log(`Sync complete: ${done}/${cards.length}`);
	} finally {
		await prisma.$disconnect();
	}
}

sync().catch((err) => {
	console.error('Sync failed:', err);
	process.exit(1);
});
