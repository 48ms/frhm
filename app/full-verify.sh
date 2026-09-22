#!/bin/bash
# full-verify.sh — Run each e2e spec in isolation with server restart
# Prevents MaxListeners leak accumulation from Sentry tunnelRoute

cd "$(dirname "$0")"

PORT=3004
export AUDIT_E2E_EMAIL=test-user@frhm.dev
export AUDIT_E2E_PASSWORD=TestPass123!
export CLIENT_E2E_EMAIL=taraju.test.4fd43222@gmail.com
export CLIENT_E2E_PASSWORD=TestPass123!
export CLIENT_ID=44b48931-a33e-470a-9f3e-9064ee46373f
export ADMIN_ID=68082013-5253-4d78-b5b6-9ddc14cbc66c

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

  # Kill any process listening on PORT (npx spawns a child node — kill by port)
  PID=$(netstat -ano 2>/dev/null | grep ":$PORT " | grep LISTENING | awk '{print $NF}' | head -1)
  if [ -n "$PID" ]; then
    taskkill //F //PID "$PID" > /dev/null 2>&1 || true
    sleep 2
  fi

  # Start fresh server (background)
  npx next start -p $PORT > /dev/null 2>&1 &
  sleep 6

  # Wait for health
  HEALTHY=0
  for i in $(seq 1 30); do
    if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
      echo "Server healthy after ${i}s"
      HEALTHY=1
      break
    fi
    sleep 1
  done
  if [ "$HEALTHY" -eq 0 ]; then
    echo "❌ Server failed to become healthy for $spec"
    FAIL=$((FAIL + 1))
    continue
  fi

  # Run test (capture exit without set -e aborting)
  npx playwright test "$spec" --reporter=list 2>&1
  TEST_EXIT=$?
  if [ $TEST_EXIT -eq 0 ]; then
    echo "✅ PASS: $spec"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL: $spec (exit $TEST_EXIT)"
    FAIL=$((FAIL + 1))
  fi

  # Kill server by port
  PID=$(netstat -ano 2>/dev/null | grep ":$PORT " | grep LISTENING | awk '{print $NF}' | head -1)
  if [ -n "$PID" ]; then
    taskkill //F //PID "$PID" > /dev/null 2>&1 || true
  fi
  sleep 1
done

echo ""
echo "=== FULL VERIFY RESULTS ==="
echo "PASS: $PASS / $((PASS + FAIL))"
echo "FAIL: $FAIL / $((PASS + FAIL))"
