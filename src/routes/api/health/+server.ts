import { json } from '@sveltejs/kit';
import prisma from '$lib/server/database';

const startedAt = Date.now();

export async function GET({ url }) {
	const deep = url.searchParams.get('deep') === '1';

	if (!deep) {
		return json({ status: 'ok', uptimeMs: Date.now() - startedAt });
	}

	try {
		await prisma.$queryRawUnsafe('SELECT 1');
		return json({ status: 'ok', db: 'ok', uptimeMs: Date.now() - startedAt });
	} catch (err) {
		return json(
			{ status: 'degraded', db: 'error', error: (err as Error).message },
			{ status: 503 }
		);
	}
}
