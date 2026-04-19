# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Yu-Gi-Oh! card database + deck builder targeted at Yu-Gi-Oh! players. Card data comes from the YGOProDeck public API (`https://db.ygoprodeck.com/api/v7`) and is mirrored into a local MySQL database so the app reads from its own DB, not the upstream API at request time.

Production target: a single Ubuntu VPS running `docker compose -f docker-compose.prod.yml` (app + MySQL + Caddy). Full deploy runbook in `DEPLOY.md`.

## Commands

All commands run from `yugioh-app/` (the project root lives one level below the repo root).

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:5173 |
| `npm run build` | Production build — emits a Node server to `build/` via `@sveltejs/adapter-node` |
| `npm run start` | Run the built server (`node build`) |
| `npm run check` | `svelte-kit sync && svelte-check` — type/Svelte diagnostics |
| `npm run docker:up` / `docker:down` | Dev-only MySQL container (`docker-compose.yml`) |
| `npm run db:push` | Push `prisma/schema.prisma` to the DB (what the Docker entrypoint runs on startup) |
| `npm run db:migrate` / `db:deploy` | For migration-based workflows — not used today |
| `npm run db:generate` | Regenerate the Prisma client (run after schema edits) |
| `npm run db:studio` | Prisma Studio GUI on http://localhost:5555 |
| `npm run sync:cards` | Full card sync from YGOProDeck → local DB |
| `npm run sync:cards:incremental` | Incremental sync — last 7 days (cron-friendly) |

Production compose commands live in `DEPLOY.md`. Use `docker compose -f docker-compose.prod.yml ...` for everything in prod.

There is no test runner configured. `svelte-check` is the only static verification; there are known pre-existing implicit-`any` warnings in `.svelte` files that do not block `vite build`.

First-run bootstrap (dev): `docker:up` → `db:push` → `sync:cards` → `dev`.

## Architecture

**Stack.** SvelteKit 2 (Svelte 4) + TypeScript, TailwindCSS + shadcn-svelte (`bits-ui`), Prisma ORM → MySQL 8. `@sveltejs/adapter-node` — `build/` contains a Node server entrypoint; production runs it directly as PID 1 inside the `app` container.

**Data flow.**
1. `scripts/sync-cards.ts` pulls from `cardinfo.php` and upserts `Card`, `CardImage` (small + large), `CardPrice`. Runs with concurrency 8 (`Promise.all` workers, non-transactional upserts). Supports `--since=<N>d` for incremental fetch via the API's `dateregion` param. This is the only writer for card tables — the app itself never writes cards, only `Deck`.
2. Pages use SvelteKit `+page.server.ts` `load` functions that query Prisma directly through a singleton (`src/lib/server/database.ts`, `globalThis`-guarded so HMR doesn't leak connections). No separate service/repository layer.
3. `src/lib/api/ygoprodeck.ts` wraps the upstream API for any runtime calls, but current pages do not use it — reads go through Prisma. Keep it that way unless you are intentionally adding a live-API feature.
4. `src/routes/api/*/+server.ts` exposes minimal JSON endpoints (`/api/cards` search, `/api/decks` POST, `/api/health`).

**Caching (`src/lib/server/cache.ts`).** In-process TTL cache with request coalescing. Used for homepage stats, archetype list, filter dropdowns, card detail pages, and search results. TTLs: `SHORT=60s`, `DEFAULT=5m`, `LONG=30m`. Cache keys are deterministic strings — see existing call sites before adding new ones. To scale past one app instance, swap this module for a Redis-backed implementation (same `cached()` / `invalidate()` signature).

**Rate limiting (`src/hooks.server.ts` + `src/lib/server/rate-limit.ts`).** Per-IP token bucket on `/api/*`: 120 req/min for GET, 10 req/min for writes. `/api/health` is exempt (Docker healthcheck). Client IP is resolved via `x-forwarded-for` first so it works behind Caddy.

**Prisma schema highlights** (`prisma/schema.prisma`):
- Preview features `fullTextIndex` + `fullTextSearch` are enabled. `Card.name` has a FULLTEXT index (`Card_name_ft`) — for search, prefer `prisma.card.findMany({ where: { name: { search: '+term*' } } })` over `contains` as usage grows.
- `Card.id` is the upstream YGOProDeck id (not auto-increment) — this is what makes sync idempotent via `upsert`.
- `CardImage` is uniquely keyed on `(cardId, imageType)`; only `small` and `large` types are written by the sync script.
- `CardPrice.cardId` is `@unique` so sync uses a straight `upsert` (not `findFirst` + update/create).
- `Deck` uses `uuid` ids and is the only user-writable table. Its `mainDeck`/`extraDeck`/`sideDeck` are stored as arrays of `Card.id` numbers. Do NOT `JSON.stringify` before writing — Prisma handles JSON serialization for `Json` columns. `/api/decks` POST sanitizes input (length caps, integer-only ids).

**Route conventions.**
- `src/routes/+page.server.ts` — homepage: featured cards, counts, top archetypes (all cached).
- `src/routes/cards/+page.server.ts` — paginated list (`pageSize=24`, `maxPage=500`) with filter `groupBy` queries for filter dropdowns (cached as `cards:filters`). Filters use Prisma `contains` on `name`/`type`; MySQL's default collation makes these case-insensitive.
- `src/routes/cards/[id]/+page.server.ts` — card detail + related-by-archetype (cached per id).
- `src/routes/decks/builder/+page.svelte` — client-side deck builder; saves via `POST /api/decks`.
- `src/routes/api/health/+server.ts` — liveness (`GET /api/health`) and DB readiness (`GET /api/health?deep=1`). Used by the Docker healthcheck.

**Env.** `.env` is gitignored — copy from `.env.example`. Required in production: `DATABASE_URL`, `MYSQL_*` (compose uses these to provision the DB), `ORIGIN` (full https URL — SvelteKit rejects form POSTs without this), `CADDY_DOMAIN`, plus proxy headers (`PROTOCOL_HEADER`, `HOST_HEADER`).

## Production deployment

- `Dockerfile` — multi-stage (`deps` → `build` → `runtime`), runs as non-root `app` user, uses `tini` as PID 1, healthchecks `/api/health`.
- `scripts/docker-entrypoint.sh` — runs `prisma db push --skip-generate --accept-data-loss=false` before `node build`. Set `SKIP_DB_PUSH=1` to bypass.
- `docker-compose.prod.yml` — `mysql` (no host port exposed), `app` (internal network only), `caddy` (80/443 exposed). Passwords required via `.env`.
- `Caddyfile` — auto-HTTPS via Let's Encrypt. Sets `Cache-Control: immutable` for `/_app/immutable/*` build assets, trusts X-Forwarded-* from private ranges, strips `Server` header.
- See `DEPLOY.md` for the end-to-end runbook (VPS setup, cron for incremental sync, backup/restore, scaling notes).

## Things to know before editing

- After any `schema.prisma` change, run `db:generate` locally so TypeScript picks up new types. In production the entrypoint runs `db push` on startup — if a change is destructive, it will fail (good) and the container will not start until you resolve drift manually.
- Heavy `groupBy`/`count` queries in page loads are already cached. If you add new ones to `load()`, wrap them in `cached(key, ttl, loader)` — don't re-run them per request.
- The sync script re-upserts every card in full mode. Use `--since=<N>d` for scheduled runs (cron wires this up via the host crontab — see DEPLOY.md).
- Rate limit headers (`x-ratelimit-*`) are set on every `/api/*` response. Don't remove them — they're part of the contract.
- `ORIGIN` env var is mandatory in production. Without it, SvelteKit's adapter-node will reject form POSTs (origin check). The deploy domain is currently `50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io`.
- `docker-compose.yml` (no `.prod`) is dev-only and exposes MySQL on `3306`. Never run it on the VPS.
