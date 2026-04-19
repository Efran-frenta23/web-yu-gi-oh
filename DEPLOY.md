# Deployment Guide — Dalang VPS

Target: Dalang VPS `vps-50e5d6dc` (service name `sigma`). Public URL: `https://50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io`.

HTTPS is terminated at the Dalang edge and plain HTTP is forwarded to port 80 on the VPS. `docker compose` maps host `:80` → container `:3000`. Two containers: `app` (SvelteKit) + `mysql` (MySQL 8). No reverse proxy needed.

---

## 1. One-time setup (on the VPS)

Open a shell:

```bash
dalang shell vps-50e5d6dc
```

Clone the repo:

```bash
sudo mkdir -p /opt/yugioh-app
sudo chown "$USER":"$USER" /opt/yugioh-app
cd /opt/yugioh-app
git clone https://github.com/Efran-frenta23/web-yu-gi-oh.git .
```

> The repo has an extra `yugioh-app/` subdirectory. If your clone root doesn't already look like the app root (`docker-compose.prod.yml`, `Dockerfile`, `package.json` at the top level), `cd yugioh-app` so you're in the project root.

Configure environment:

```bash
cp .env.example .env
nano .env
```

Required values:

```
MYSQL_ROOT_PASSWORD=<openssl rand -base64 24>
MYSQL_DATABASE=yugioh_db
MYSQL_USER=yugioh_user
MYSQL_PASSWORD=<openssl rand -base64 24>
DATABASE_URL="mysql://yugioh_user:<same-as-MYSQL_PASSWORD>@mysql:3306/yugioh_db?connection_limit=10&pool_timeout=20"
ORIGIN=https://50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io
PROTOCOL_HEADER=x-forwarded-proto
HOST_HEADER=x-forwarded-host
BODY_SIZE_LIMIT=512K
PORT=3000
```

Lock permissions:

```bash
chmod 600 .env
```

---

## 2. Build and start

Build the image on the VPS (one-time, ~5–10 minutes — VPS disk is 8 MB/s and the Xeon v3 CPU is older, but the result is cached):

```bash
docker compose -f docker-compose.prod.yml build
```

Bring everything up:

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f app mysql
```

Wait until you see `[entrypoint] starting app...` followed by SvelteKit listening on port 3000. `Ctrl+C` out of the logs — services keep running.

---

## 3. Populate cards (initial sync)

The database starts empty. Run the full sync once:

```bash
docker compose -f docker-compose.prod.yml exec app node_modules/.bin/tsx scripts/sync-cards.ts
```

Takes 5–10 minutes depending on upstream. Idempotent (`upsert`) — safe to rerun.

---

## 4. Verify

From your laptop:

```bash
curl -I https://50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io/
curl   https://50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io/api/health
curl  'https://50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io/api/health?deep=1'
```

Expected:

- Homepage: `HTTP/2 200`
- `/api/health`: `{ "ok": true, ... }`
- `/api/health?deep=1`: `{ "ok": true, "db": "ok", ... }`

If the edge returns `Domain Not Found`, the Dalang routing slot for this service isn't activated — check the Dalang dashboard (`dalang.io` → VPS `sigma` → Public Domain section).

---

## 5. Update the app (subsequent deploys)

Inside `dalang shell vps-50e5d6dc`:

```bash
cd /opt/yugioh-app
git pull
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
```

Rebuilds typically take 3–5 minutes (npm install layer is cached; only source layer rebuilds).

---

## 6. Schedule incremental sync (host cron)

Inside the VPS shell:

```bash
crontab -e
```

Append:

```
# Every Sunday 03:00 UTC — pull cards changed in the last 14 days
0 3 * * 0 cd /opt/yugioh-app && /usr/bin/docker compose -f docker-compose.prod.yml exec -T app node_modules/.bin/tsx scripts/sync-cards.ts --since=14d >> /var/log/yugioh-sync.log 2>&1
```

---

## 7. Ongoing operations

> **`dalang shell` quirk (CLI v1.2.0-dirty):** `dalang shell vps-<name> "cmd"` hangs 60+ s. Use interactive mode or pipe via stdin: `echo 'cmd' | dalang shell vps-50e5d6dc`. Binary stdin is corrupt — don't try to pipe tar/images through it.

| Task | Command |
|---|---|
| Open VPS shell | `dalang shell vps-50e5d6dc` (interactive) |
| Tail app logs | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml logs -f app` |
| Restart app | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml restart app` |
| MySQL shell | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml exec mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" yugioh_db` |
| Backup DB | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml exec -T mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" yugioh_db \| gzip > backup-$(date +%F).sql.gz` |
| Force full resync | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml exec app node_modules/.bin/tsx scripts/sync-cards.ts` |
| VPS snapshot | dalang.io dashboard → VPS `sigma` → Snapshots → Create Snapshot (max 3) |

---

## 8. Optional — faster deploys via GHCR

If rebuilding on the VPS for every change gets annoying, switch to building on your laptop and pushing to GitHub Container Registry. Deploy #2 onward drops to ~10–30 seconds via layer reuse.

**One-time setup:**

1. GitHub → Settings → Developer settings → Personal access tokens (classic) → generate with scopes `write:packages`, `read:packages`.
2. Laptop:
   ```bash
   echo <PAT> | docker login ghcr.io -u efran-frenta23 --password-stdin
   ```
3. Build + push:
   ```bash
   docker buildx build --platform linux/amd64 \
     -t ghcr.io/efran-frenta23/yugioh-app:latest --push .
   ```
4. Mark package public so the VPS can pull without auth: github.com → your profile → Packages → `yugioh-app` → Package settings → Change visibility → Public.

**Per deploy:**

```bash
docker buildx build --platform linux/amd64 \
  -t ghcr.io/efran-frenta23/yugioh-app:latest --push .

echo 'cd /opt/yugioh-app \
  && docker compose -f docker-compose.prod.yml pull app \
  && docker compose -f docker-compose.prod.yml up -d app' \
  | dalang shell vps-50e5d6dc
```

---

## 9. Scaling beyond one instance

Single VPS on 8 GB comfortably serves the read-heavy cached workload at the target range. If you outgrow it:

1. **Vertical first** — upgrade the Dalang VPS tier, bump `innodb-buffer-pool-size` and `connection_limit` in `DATABASE_URL`.
2. **Swap in-process cache for Redis** — `src/lib/server/cache.ts` is per-process today. Replace with Redis so multiple app replicas share a cache.
3. **Horizontal app replicas** — add a small proxy container on `:80` that load-balances across N `app` containers. Dalang edge still only forwards to `:80`, so the proxy comes back in at that point — not before.
4. **CDN for static assets** — upload `build/client/_app/immutable/*` to Cloudflare R2/Pages and rewrite the base path.

---

## 10. Troubleshooting

| Symptom | Check |
|---|---|
| `Domain Not Found` at edge | Dalang routing slot inactive — dashboard → VPS `sigma` → Public Domain section |
| App restart loop | `docker compose logs app` — usually `DATABASE_URL` wrong, MySQL unhealthy, or missing `ORIGIN` |
| `prisma db push` wants to drop data | Schema drift. `docker compose run --rm app npx prisma db pull` and resolve manually |
| 429 on `/api/*` | Rate limit (120 GET/min, 10 write/min per IP). Tune in `src/hooks.server.ts` |
| Homepage feels stale | Cached up to 30 min. Restart app to purge: `docker compose restart app` |
| Build OOM on VPS | VPS has no swap. `npm install` is the peak — retry, or switch to GHCR flow (§8) to build off-VPS |
| Build very slow | Expected on first build (disk 8 MB/s + Xeon v3). Subsequent rebuilds reuse the `deps` layer and only redo the source step |
| `dalang shell vps-... "cmd"` hangs | CLI quirk — use interactive or `echo 'cmd' \| dalang shell vps-50e5d6dc` |
