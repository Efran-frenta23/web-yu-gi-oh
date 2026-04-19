type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 500;

function sweep() {
	if (store.size <= MAX_ENTRIES) return;
	const now = Date.now();
	for (const [k, v] of store) {
		if (v.expires <= now) store.delete(k);
		if (store.size <= MAX_ENTRIES) return;
	}
	while (store.size > MAX_ENTRIES) {
		const oldest = store.keys().next().value;
		if (oldest === undefined) break;
		store.delete(oldest);
	}
}

export async function cached<T>(
	key: string,
	ttlMs: number,
	loader: () => Promise<T>
): Promise<T> {
	const now = Date.now();
	const hit = store.get(key) as Entry<T> | undefined;
	if (hit && hit.expires > now) return hit.value;

	const pending = inflight.get(key) as Promise<T> | undefined;
	if (pending) return pending;

	const promise = loader()
		.then((value) => {
			store.set(key, { value, expires: Date.now() + ttlMs });
			sweep();
			return value;
		})
		.finally(() => {
			inflight.delete(key);
		});

	inflight.set(key, promise);
	return promise;
}

export function invalidate(key: string) {
	store.delete(key);
}

export function invalidatePrefix(prefix: string) {
	for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}

export const TTL = {
	SHORT: 60 * 1000,
	DEFAULT: DEFAULT_TTL_MS,
	LONG: 30 * 60 * 1000
};
