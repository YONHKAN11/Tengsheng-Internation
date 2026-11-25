#!/bin/sh
set -e

if [ "${PAYLOAD_PUSH:-false}" = "true" ]; then
  echo "[entrypoint] initialising database schema and seed data..."
  NODE_ENV=development ./node_modules/.bin/tsx scripts/init-db.ts
  echo "[entrypoint] initialisation finished"
fi

exec npm run start
