#!/bin/sh
set -e

if [ "${SKIP_DB_PUSH:-0}" != "1" ]; then
  echo "[entrypoint] applying Prisma schema to database..."
  npx --no-install prisma db push --skip-generate --accept-data-loss=false
fi

echo "[entrypoint] starting app..."
exec node build
