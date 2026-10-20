#!/usr/bin/env bash
# Frhm deploy: stop -> pull -> install -> build -> start -> healthcheck -> rollback
set -Eeuo pipefail

REPO=/home/ubuntu/frhm
APP=$REPO/app
LOG=/home/ubuntu/frhm-deploy.log
LOCK=/tmp/frhm-deploy.lock
PREV_BUILD=/home/ubuntu/frhm-next-prev

exec 9>"$LOCK"
if ! flock -n 9; then echo "Another deploy is running"; exit 1; fi
exec >>"$LOG" 2>&1

echo "=== $(date -Is) deploy start ==="
cd "$REPO"
PREV=$(git rev-parse HEAD)
echo "current commit: $PREV"

git fetch --prune origin
git pull --ff-only

cd "$APP"
npm ci --no-audit --no-fund

# The build is the memory hog on a 2 GB box: stop the server first.
pm2 stop frhm >/dev/null 2>&1 || true
rm -rf "$PREV_BUILD"
[ -d .next ] && mv .next "$PREV_BUILD"

if ! NODE_OPTIONS="--max-old-space-size=1536" npm run build; then
  echo "BUILD FAILED — restoring previous .next"
  rm -rf .next
  [ -d "$PREV_BUILD" ] && mv "$PREV_BUILD" .next
  pm2 startOrReload "$REPO/workspace/ecosystem.config.js" --only frhm >/dev/null 2>&1 || pm2 restart frhm >/dev/null 2>&1 || true
  echo "=== $(date -Is) deploy aborted ==="
  exit 1
fi

pm2 startOrReload "$REPO/workspace/ecosystem.config.js" --only frhm >/dev/null 2>&1 || pm2 restart frhm >/dev/null 2>&1

ok=0
for _ in $(seq 1 30); do
  if [ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/)" = "200" ]; then ok=1; break; fi
  sleep 2
done

if [ "$ok" != "1" ]; then
  echo "HEALTHCHECK FAILED — rolling back .next"
  pm2 stop frhm >/dev/null 2>&1 || true
  rm -rf .next
  [ -d "$PREV_BUILD" ] && mv "$PREV_BUILD" .next
  pm2 startOrReload "$REPO/workspace/ecosystem.config.js" --only frhm >/dev/null 2>&1 || pm2 restart frhm >/dev/null 2>&1 || true
  echo "=== $(date -Is) deploy rolled back ==="
  exit 1
fi

rm -rf "$PREV_BUILD"
echo "deploy OK: $(git rev-parse --short HEAD)"
echo "=== $(date -Is) deploy done ==="
