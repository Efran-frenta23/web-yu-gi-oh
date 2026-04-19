type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 20_000;

function prune(now: number) {
	if (buckets.size < MAX_KEYS) return;
	for (const [k, b] of buckets) {
		if (b.resetAt <= now) buckets.delete(k);
		if (buckets.size < MAX_KEYS / 2) return;
	}
}

export interface RateLimitOptions {
	limit: number;
	windowMs: number;
}

export interface RateLimitResult {
	ok: boolean;
	remaining: number;
	resetAt: number;
	retryAfterSec: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
	const now = Date.now();
	prune(now);

	let b = buckets.get(key);
	if (!b || b.resetAt <= now) {
		b = { count: 0, resetAt: now + opts.windowMs };
		buckets.set(key, b);
	}

	b.count++;
	const remaining = Math.max(0, opts.limit - b.count);
	const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
	return { ok: b.count <= opts.limit, remaining, resetAt: b.resetAt, retryAfterSec };
}
