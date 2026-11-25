#!/usr/bin/env bash
# Back up the database and uploaded media into ./backups
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f deploy.env ]; then
  echo "deploy.env not found"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source deploy.env
set +a

STAMP="$(date +%F-%H%M)"
mkdir -p backups

echo "Dumping Postgres..."
docker compose --env-file deploy.env -f docker-compose.prod.yml exec -T db \
  pg_dump -U tengsheng tengsheng | gzip > "backups/db-${STAMP}.sql.gz"

MEDIA_VOL="$(docker volume ls -q | grep -E '_media$' | head -1 || true)"
VIDEO_VOL="$(docker volume ls -q | grep -E '_videos$' | head -1 || true)"

if [ -n "$MEDIA_VOL" ]; then
  echo "Archiving media ($MEDIA_VOL)..."
  docker run --rm -v "${MEDIA_VOL}:/data:ro" -v "$PWD/backups":/backup alpine \
    tar czf "/backup/media-${STAMP}.tgz" -C /data .
fi

if [ -n "$VIDEO_VOL" ]; then
  echo "Archiving videos ($VIDEO_VOL)..."
  docker run --rm -v "${VIDEO_VOL}:/data:ro" -v "$PWD/backups":/backup alpine \
    tar czf "/backup/videos-${STAMP}.tgz" -C /data .
fi

echo
echo "Backup written to $(pwd)/backups:"
ls -lh backups | tail -5
