#!/bin/bash
set -e

cd /home/sprite/meal-plan

echo "Building..."
npm run build

echo "Redeploying service..."
sprite-env services delete meal-plan 2>/dev/null || true
sprite-env services create meal-plan \
  --cmd /home/sprite/meal-plan/start.sh \
  --http-port 3000 \
  --no-stream

echo "Waiting for port 3000..."
for i in $(seq 1 20); do
  if ss -tlnp | grep -q ':3000'; then
    echo "Server is up."
    exit 0
  fi
  sleep 1
done

echo "ERROR: Server did not come up in time." >&2
exit 1
