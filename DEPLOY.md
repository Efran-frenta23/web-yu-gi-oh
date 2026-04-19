# Deployment Guide — VPS (Ubuntu 24.04, 8GB RAM)

Target: Ubuntu 24.04 VPS, single host, 1 app instance + MySQL + Caddy in Docker. Caddy terminates HTTPS for your domain and reverse-proxies to the SvelteKit app.

Tested sizing for 8GB RAM:
- MySQL InnoDB buffer pool: 1 GB (configured in `docker-compose.prod.yml`)
- App Node process: ~200–400 MB resident under load
- Caddy: ~30 MB
- Headroom: plenty for this workload

---

## 1. Prepare the VPS

SSH in as root or a sudoer:

```bash
ssh user@your-vps
```

Install Docker Engine + Compose plugin:

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
   https://download.docker.com/linux/ubuntu \
   $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
# log out / back in so the group applies, or run `newgrp docker`
```

Verify:

```bash
docker version
docker compose version
```

Open firewall ports 80 and 443 (ufw example):

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 2. Upload the project

From your laptop:

```bash
rsync -az --delete \
  --exclude node_modules --exclude .svelte-kit --exclude build \
  --exclude .env --exclude sync.log \
  yugioh-app/ user@your-vps:/opt/yugioh-app/
```

On the VPS:

```bash
cd /opt/yugioh-app
```

## 3. Configure environment

Copy the example and edit:

```bash
cp .env.example .env
nano .env
```

Required values for production:

```
MYSQL_ROOT_PASSWORD=<generate with: openssl rand -base64 24>
MYSQL_DATABASE=yugioh_db
MYSQL_USER=yugioh_user
MYSQL_PASSWORD=<generate with: openssl rand -base64 24>

# Inside the compose network the DB host is `mysql`:
DATABASE_URL="mysql://yugioh_user:<same-as-above>@mysql:3306/yugioh_db?connection_limit=10&pool_timeout=20"

ORIGIN=https://50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io
CADDY_DOMAIN=50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io
PROTOCOL_HEADER=x-forwarded-proto
HOST_HEADER=x-forwarded-host
BODY_SIZE_LIMIT=512K
PORT=3000
```

Lock permissions:

```bash
chmod 600 .env
```

## 4. First-time build + start

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Watch logs until MySQL is healthy and the app finishes `prisma db push`:

```bash
docker compose -f docker-compose.prod.yml logs -f app mysql
```

Expected: `[entrypoint] starting app...` then SvelteKit listening on port 3000.

## 5. Populate cards (initial sync)

The DB starts empty. Run the full sync inside the app container:

```bash
docker compose -f docker-compose.prod.yml exec app node_modules/.bin/tsx scripts/sync-cards.ts
```

This takes roughly 5–10 minutes depending on the upstream API. Rerun at any time — the script is idempotent (`upsert`).

## 6. Verify

From your laptop:

```bash
curl -I https://50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io/
curl https://50e5d6dc-6f31-4fb8-86f1-55830f9c8e04.svc.dalang.io/api/health?deep=1
```

Caddy auto-issues a Let's Encrypt cert on first request. The first call may take ~15 s while it provisions.

## 7. Schedule incremental sync (host cron)

Add a weekly incremental sync via the host's crontab:

```bash
crontab -e
```

Append:

```
# Every Sunday 03:00 UTC — pull cards changed in the last 14 days
0 3 * * 0 cd /opt/yugioh-app && /usr/bin/docker compose -f docker-compose.prod.yml exec -T app node_modules/.bin/tsx scripts/sync-cards.ts --since=14d >> /var/log/yugioh-sync.log 2>&1
```

## 8. Ongoing operations

| Task | Command |
|---|---|
| Pull new code | `rsync ...` again, then `docker compose -f docker-compose.prod.yml build app && docker compose -f docker-compose.prod.yml up -d app` |
| Tail app logs | `docker compose -f docker-compose.prod.yml logs -f app` |
| Restart app only | `docker compose -f docker-compose.prod.yml restart app` |
| MySQL shell | `docker compose -f docker-compose.prod.yml exec mysql mysql -u root -p$MYSQL_ROOT_PASSWORD yugioh_db` |
| Backup DB | `docker compose -f docker-compose.prod.yml exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD yugioh_db | gzip > backup-$(date +%F).sql.gz` |
| Force full resync | `docker compose -f docker-compose.prod.yml exec app node_modules/.bin/tsx scripts/sync-cards.ts` |

## 9. Scaling beyond 1 instance

Single instance on 8 GB will handle the "tens of thousands concurrent viewers, hundreds of RPS" range for this workload (read-heavy, cached). If you outgrow it:

1. **Vertical first** — bigger VPS (16 GB RAM, 4 vCPU), bump `innodb-buffer-pool-size`, raise `connection_limit` in `DATABASE_URL`.
2. **Move cache to Redis** — the `cached()` helper in `src/lib/server/cache.ts` is in-process today. Replace with a Redis-backed implementation so multiple app replicas share cache.
3. **Scale app horizontally** — run N `app` replicas behind Caddy's `reverse_proxy` (it load-balances by default when you list multiple upstreams). MySQL stays single-instance; add a read replica only if reads become the bottleneck.
4. **Offload images** — Caddy can proxy and cache upstream `images.ygoprodeck.com` responses on disk to reduce outbound requests.

## 10. Troubleshooting

| Symptom | Check |
|---|---|
| Caddy can't issue cert | `docker compose -f docker-compose.prod.yml logs caddy` — usually DNS not pointing to VPS or port 80 blocked |
| App restart loop | `docker compose -f docker-compose.prod.yml logs app` — most often `DATABASE_URL` wrong or MySQL not healthy |
| `prisma db push` wants to drop data | Schema drift. Inspect `docker compose -f docker-compose.prod.yml run --rm app npx prisma db pull` and resolve manually |
| 429 Too Many Requests on `/api/*` | Rate limit (120 GET/min, 10 write/min per IP). Tune in `src/hooks.server.ts` |
| Homepage stats feel stale | Expected — cached 30 min. Restart app to purge: `docker compose restart app` |
