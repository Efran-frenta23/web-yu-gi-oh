import type { Handle, HandleServerError } from '@sveltejs/kit';
import { rateLimit } from '$lib/server/rate-limit';

const API_GET_LIMIT = { limit: 120, windowMs: 60_000 };
const API_WRITE_LIMIT = { limit: 10, windowMs: 60_000 };

function clientIp(event: Parameters<Handle>[0]['event']): string {
	const xff = event.request.headers.get('x-forwarded-for');
	if (xff) return xff.split(',')[0].trim();
	const real = event.request.headers.get('x-real-ip');
	if (real) return real.trim();
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/api/') && pathname !== '/api/health') {
		const method = event.request.method;
		const isWrite = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
		const ip = clientIp(event);
		const opts = isWrite ? API_WRITE_LIMIT : API_GET_LIMIT;
		const key = `${isWrite ? 'w' : 'r'}:${pathname}:${ip}`;

		const rl = rateLimit(key, opts);
		if (!rl.ok) {
			return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
				status: 429,
				headers: {
					'content-type': 'application/json',
					'retry-after': String(rl.retryAfterSec),
					'x-ratelimit-limit': String(opts.limit),
					'x-ratelimit-remaining': '0',
					'x-ratelimit-reset': String(Math.floor(rl.resetAt / 1000))
				}
			});
		}

		const response = await resolve(event);
		response.headers.set('x-ratelimit-limit', String(opts.limit));
		response.headers.set('x-ratelimit-remaining', String(rl.remaining));
		response.headers.set('x-ratelimit-reset', String(Math.floor(rl.resetAt / 1000)));
		return response;
	}

	return resolve(event);
};

export const handleError: HandleServerError = ({ error, event }) => {
	console.error(`[${event.request.method} ${event.url.pathname}]`, error);
	return { message: 'Internal error' };
};
