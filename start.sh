#!/bin/bash
cd /home/sprite/meal-plan
set -a
source /home/sprite/meal-plan/.env 2>/dev/null || true
set +a
exec ./node_modules/.bin/react-router-serve /home/sprite/meal-plan/build/server/index.js
