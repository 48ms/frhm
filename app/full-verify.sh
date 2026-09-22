#!/bin/bash
# full-verify.sh — Run each e2e spec in isolation with server restart
# Prevents MaxListeners leak accumulation from Sentry tunnelRoute
set -e

cd "$(dirname "$0")"

PORT=3004
ENV_ARGS=(
  -e AUDIT_E2E_EMAIL=test-user@frhm.dev
  -e AUDIT_E2E_PASSWORD=TestPass123!
  -e CLIENT_E2E_EMAIL=taraju.test.4fd43222@gmail.com
  -e CLIENT_E2E_PASSWORD=clientpass123!
  -e CLIENT_ID=44b48931-a33e-470a-9f3e-9064ee46373f
  -e ADMIN_ID=68082013-5253-4d78-b5b6-9ddc14cbc66c
)

SPECS=(
  e2e/final-sweep.spec.ts
  e2e/admin-budget-form.spec.ts
  e2e/admin-campaign-form.spec.ts
  e2e/admin-crosstab.spec.ts
  e2e/admin-platform-posts.spec.ts
  e2e/admin-user-management.spec.ts
  e2e/crud-verify.spec.ts
  e2e/client-approve-revision.spec.ts
  e2e/client-telegram-disconnect.spec.ts
  e2e/client-settings-telegram.spec.ts
)

PASS=0
FAIL=0

for spec in "${SPECS[@]}"; do
  echo "=== Running $spec ==="

  # Kill existing server
  PID=$(netstat -ano 2>/dev/null | grep ":$PORT" | grep LISTENING | awk '{print $5}' | head -1)
  if [ -n "$PID" ]; then
    taskkill //F //PID "$PID" > /dev/null 2>&1 || true
    sleep 2
  fi

  # Start fresh server
  npx next start -p $PORT &
  SERVER_PID=$!
  sleep 5

  # Wait for health
  for i in $(seq 1 30); do
    if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
      echo "Server healthy after ${i}s"
      break
    fi
    sleep 1
  done

  # Run test
  npx playwright test "$spec" --reporter=list 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ PASS: $spec"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL: $spec"
    FAIL=$((FAIL + 1))
  fi

  # Kill server
  taskkill //F //PID "$SERVER_PID" > /dev/null 2>&1 || true
  sleep 1
done

echo ""
echo "=== FULL VERIFY RESULTS ==="
echo "PASS: $PASS / $((PASS + FAIL))"
echo "FAIL: $FAIL / $((PASS + FAIL))"
