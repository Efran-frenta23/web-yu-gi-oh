# Deployment Guide — Dalang VPS (Ubuntu 24.04, 8 GB RAM)

Target: single Dalang VPS (`vps-50e5d6dc`, service name `sigma`). HTTPS is terminated at the Dalang edge — the app itself listens on plain HTTP internally. Two containers: `app` (SvelteKit / adapter-node) + `mysql` (MySQL 8). **No Caddy** — Dalang routes public traffic to port 80 on the VPS by contract, so the reverse proxy layer is redundant. `docker compose` maps host `:80` directly to the app container's `:3000`.

Sizing baseline (8 GB RAM, 4 vCPU Xeon v3, 40 GB SSD ~8 MB/s sustained write, no swap):

- MySQL InnoDB buffer pool: 1 GB
- App Node process: ~200–400 MB under load, hard-capped at 1 GB via `mem_limit`
- Guest-side free RAM after boot: ~7 GB (plenty of headroom)
- **Images are built on your laptop, never on the VPS** — the VPS disk is too slow and the Xeon v3 is too old for `docker build` to be practical

---

## 0. Prerequisites (one-time, laptop side)

- Docker 24+ with Buildx (`docker buildx version`)
- `zstd` for the image-shipping pipe (`apt install zstd` / `brew install zstd`)
- Dalang CLI authenticated (`dalang auth whoami`)
- Repo checked out, `.env` NOT committed

On the VPS (already true per probe):

- Docker 29.x + Compose v5 installed
- No public IPv4 — access is via `dalang shell vps-50e5d6dc`
- Auto-assigned public domain: `50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io`
- TLS is terminated at the Dalang edge; traffic reaches the VPS as HTTP on port 80

---

## 1. First-time VPS setup

Open a shell on the VPS:

```bash
dalang shell vps-50e5d6dc
```

Create the deploy directory:

```bash
sudo mkdir -p /opt/yugioh-app
sudo chown "$USER":"$USER" /opt/yugioh-app
cd /opt/yugioh-app
```

You only need three files on the VPS:

- `docker-compose.prod.yml`
- `.env` (created from `.env.example`)
- `scripts/docker-entrypoint.sh` (referenced by the Dockerfile, already baked into the image — only needed on the VPS if you plan to `docker compose build` there, which we don't)

Upload them (from a separate laptop terminal, not the shell):

```bash
# Example using `dalang shell` and a pipe — adjust if your CLI provides a copy helper
cat docker-compose.prod.yml | dalang shell vps-50e5d6dc "cat > /opt/yugioh-app/docker-compose.prod.yml"
cat .env.example           | dalang shell vps-50e5d6dc "cat > /opt/yugioh-app/.env.example"
```

### Configure `.env` on the VPS

Inside `dalang shell vps-50e5d6dc`:

```bash
cd /opt/yugioh-app
cp .env.example .env
nano .env
```

Set at minimum:

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

Lock it down:

```bash
chmod 600 .env
```

---

## 2. Deploy — GHCR (the only deploy path that works here)

> **Why not a pipe?** `dalang shell vps-<name> "..."` corrupts binary stdin (PTY-mediated) and the trailing-command form hangs anyway. `scp` isn't available either — the VPS has no public IPv4. GHCR is the only clean route: push from laptop → pull on VPS through the Dalang edge.

### One-time setup

1. On GitHub → Settings → Developer settings → Personal access tokens (classic) → **Generate new token (classic)**. Scopes: `write:packages`, `read:packages`. Pick an expiration you're comfortable with (30–90 days is fine; you can revoke after deploy).

2. On your laptop:
   ```bash
   echo <PAT> | docker login ghcr.io -u efran-frenta23 --password-stdin
   ```

3. Decide package visibility. **Recommended: public** — the source code is already public on GitHub, the image is a deterministic build of it, and public packages let the VPS pull without auth (one less friction point through the buggy `dalang shell`). To mark public after the first push:
   - github.com → your profile → Packages → `yugioh-app` → Package settings → Change visibility → Public.

   If you keep it private, the VPS also needs to log in — and `dalang shell` stdin is the only path, see §7.

### Per deploy

From the app repo root on your laptop:

```bash
TAG=$(git rev-parse --short HEAD)

docker buildx build --platform linux/amd64 \
  -t ghcr.io/efran-frenta23/yugioh-app:$TAG \
  -t ghcr.io/efran-frenta23/yugioh-app:latest \
  --push .
```

Then trigger the VPS to pull + roll. Because `dalang shell vps-<name> "cmd"` hangs, pipe the command in via stdin:

```bash
echo 'cd /opt/yugioh-app \
  && docker compose -f docker-compose.prod.yml pull app \
  && docker compose -f docker-compose.prod.yml up -d app' \
  | dalang shell vps-50e5d6dc
```

On deploy #1 you also need the `mysql` container up, so the first time run:

```bash
echo 'cd /opt/yugioh-app && docker compose -f docker-compose.prod.yml up -d' \
  | dalang shell vps-50e5d6dc
```

Tail logs interactively to confirm:

```bash
dalang shell vps-50e5d6dc
# then inside the shell:
cd /opt/yugioh-app
docker compose -f docker-compose.prod.yml logs -f app mysql
```

Wait for `[entrypoint] starting app...` and SvelteKit listening on `:3000`. The `app` container runs `prisma db push` on startup, so deploy #1 includes schema apply automatically.

Layer reuse kicks in from deploy #2 onward — expect 10–30 s per deploy on the 20 Mbps pipe instead of the 60 s first pull.

---

## 3. Populate cards (initial sync)

The DB starts empty. Run the full sync once:

```bash
# inside dalang shell vps-50e5d6dc, cd /opt/yugioh-app
docker compose -f docker-compose.prod.yml exec app node_modules/.bin/tsx scripts/sync-cards.ts
```

Expect 5–10 minutes depending on the upstream API. The script is idempotent (`upsert`) — safe to rerun.

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

If the edge returns `Domain Not Found`, the Dalang routing slot for this service hasn't been activated. Check the Dalang dashboard (`dalang.io` → VPS `sigma` → Public Domain section). The CLI today has no `dalang domain` flag for port/routing, so activation is dashboard-only.

---

## 5. Schedule incremental sync (host cron)

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

## 6. Fallback if GHCR is unavailable (not recommended)

Only relevant if GitHub Packages is down or you can't generate a PAT. **Not tested in this setup** — use at your own risk and burn the uploaded artifact afterwards.

```bash
# Laptop
docker save ghcr.io/efran-frenta23/yugioh-app:latest \
  | zstd -T0 -3 > /tmp/yugioh.tar.zst
# Upload /tmp/yugioh.tar.zst to a one-shot public host (e.g. transfer.sh,
# catbox.moe). Copy the URL.

# VPS — via dalang shell (interactive)
dalang shell vps-50e5d6dc
# inside:
curl -fsSL <url> | zstd -d | docker load
docker compose -f /opt/yugioh-app/docker-compose.prod.yml up -d
```

Caveats: image is briefly publicly accessible on the intermediate host, the upload consumes bandwidth twice, and you still need GHCR (or another route) for deploy #2. Default to §2.

---

## 7. Ongoing operations

> **`dalang shell` quirks (CLI v1.2.0-dirty):** the trailing-command form (`dalang shell vps-<name> "cmd"`) hangs for 60+ s. Use either interactive mode or stdin: `echo 'cmd' | dalang shell vps-50e5d6dc`. Binary stdin is corrupt — no pipe-through-tar/image transfers.

| Task | Command (run in interactive `dalang shell vps-50e5d6dc`) |
|---|---|
| Open VPS shell | `dalang shell vps-50e5d6dc` (interactive) |
| Tail app logs | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml logs -f app` |
| Restart app | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml restart app` |
| MySQL shell | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml exec mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" yugioh_db` |
| Backup DB | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml exec -T mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" yugioh_db \| gzip > backup-$(date +%F).sql.gz` |
| Force full resync | `docker compose -f /opt/yugioh-app/docker-compose.prod.yml exec app node_modules/.bin/tsx scripts/sync-cards.ts` |
| VPS snapshot | dalang.io dashboard → VPS `sigma` → Snapshots → Create Snapshot (max 3) |
| GHCR private-package login on VPS | `echo '<PAT>' \| dalang shell vps-50e5d6dc` then inside: `echo <PAT> \| docker login ghcr.io -u efran-frenta23 --password-stdin` (skip if package is public) |

---

## 8. Scaling beyond one instance

The single-VPS setup comfortably serves the read-heavy, cached workload at the target range. If you outgrow it:

1. **Vertical first** — upgrade Dalang VPS tier (more vCPU/RAM), bump `innodb-buffer-pool-size` and `connection_limit`.
2. **Swap in-process cache for Redis** — `src/lib/server/cache.ts` is per-process today. Replace with a Redis-backed implementation so multiple app replicas share a cache.
3. **Horizontal app replicas** — add a small proxy container listening on `:80` that load-balances across N `app` containers. (Dalang edge still only forwards to `:80`, so you re-introduce a proxy layer at that point — not before.)
4. **CDN for static assets** — upload `build/client/_app/immutable/*` to Cloudflare R2/Pages and rewrite the base path. Reduces VPS egress on the 20 Mbps pipe, which becomes the first bottleneck at scale.

---

## 9. Troubleshooting

| Symptom | Check |
|---|---|
| `Domain Not Found` at edge | Dalang routing slot inactive. Open dashboard → VPS `sigma` → Public Domain section. |
| App restart loop | `docker compose logs app` — usually `DATABASE_URL` wrong, MySQL unhealthy, or missing `ORIGIN` |
| `prisma db push` wants to drop data | Schema drift. `docker compose run --rm app npx prisma db pull` and resolve manually |
| 429 on `/api/*` | Rate limit (120 GET/min, 10 write/min per IP). Tune in `src/hooks.server.ts` |
| Homepage stats feel stale | Cached up to 30 min. Restart app to purge: `docker compose restart app` |
| Image push slow | 20 Mbps ≈ 2.5 MB/s. First push ~60 s, deploy #2+ uses layer reuse (~10–30 s). |
| OOM-kill | VPS has no swap. Inspect `mem_limit`, MySQL buffer pool. Consider enabling zram on the VPS. |
| `exec format error` / `node: not found` | Built for wrong arch. Re-run `docker buildx build --platform linux/amd64 ... --push`. |
| `dalang shell vps-... "cmd"` hangs | CLI quirk — don't use the trailing-command form. Use stdin: `echo 'cmd' \| dalang shell vps-50e5d6dc`, or interactive. |
| `denied: permission_denied` on pull | Either the image is private and VPS hasn't logged in to GHCR, or the tag doesn't exist yet. Check github.com → Packages. |
