#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."

exec 9>/tmp/sapa-e2e.lock
echo "Waiting for the e2e lock..."
flock 9

log=$(mktemp -d)
pids=()
finish() {
  for pid in "${pids[@]}"; do kill -- "-$pid" 2>/dev/null; done
  wait 2>/dev/null
  echo "$1"
  exit "$2"
}
trap 'finish "E2E FAIL: interrupted" 1' INT TERM
fail() { echo "$1 (logs in $log)"; finish "E2E FAIL: $1" 1; }

npx supabase start -x studio,imgproxy,storage-api,edge-runtime,logflare,vector,mailpit,postgres-meta,supavisor,realtime >"$log/supabase.log" 2>&1 \
  || fail "supabase start"
npx supabase db reset --local >>"$log/supabase.log" 2>&1 || fail "supabase db reset"
docker exec -i supabase_db_sapa psql -q -U postgres -d postgres -v ON_ERROR_STOP=1 <e2e/test-clock.sql >>"$log/supabase.log" 2>&1 \
  || fail "test clock table"
eval "$(npx supabase status -o env 2>/dev/null | sed -n 's/^\(API_URL\|PUBLISHABLE_KEY\|SECRET_KEY\)=/SB_&/p')"

export NODE_ENV=test
export SAPA_TEST=1
export PORT=54330
export APP_URL=http://127.0.0.1:$PORT
export FAKE_TELEGRAM_PORT=54331
export FAKE_MODEL_PORT=54332
export NEXT_PUBLIC_SUPABASE_URL=$SB_API_URL
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$SB_PUBLISHABLE_KEY
export SUPABASE_SECRET_KEY=$SB_SECRET_KEY
export TELEGRAM_API_BASE_URL=http://127.0.0.1:$FAKE_TELEGRAM_PORT
export TELEGRAM_BOT_TOKEN=1000000001:test-token
export TELEGRAM_BOT_USERNAME=sapa_test_bot
export TELEGRAM_WEBHOOK_SECRET_TOKEN=test-webhook-secret
export OMNIROUTE_BASE_URL=http://127.0.0.1:$FAKE_MODEL_PORT/omniroute/v1
export OMNIROUTE_API_KEY=test-omniroute-key
export DEEPSEEK_BASE_URL=http://127.0.0.1:$FAKE_MODEL_PORT/deepseek
export DEEPSEEK_API_KEY=test-deepseek-key
export GEMINI_MODEL_ID=test-gemini
export GEMINI_MODEL_ID_MEDIUM=test-gemini-medium
export DEEPSEEK_MODEL_ID=test-deepseek
export DISPATCH_SECRET=test-dispatch-secret
export DEMO_RESET_SECRET=test-demo-reset-secret
export SEED_USER_PASSWORD=test-seed-password
export REPLY_ENCRYPTION_KEY=c2FwYS10ZXN0LXJlcGx5LWVuY3J5cHRpb24ta2V5ISE=

npx next build >"$log/build.log" 2>&1 || fail "next build"

setsid node e2e/fakes/telegram.ts >"$log/telegram.log" 2>&1 9>&- & pids+=($!)
setsid node e2e/fakes/model.ts >"$log/model.log" 2>&1 9>&- & pids+=($!)
setsid npx next start -H 127.0.0.1 -p "$PORT" >"$log/app.log" 2>&1 9>&- & pids+=($!)

for _ in $(seq 60); do
  curl -s -o /dev/null "$APP_URL" && break
  sleep 1
done
curl -s -o /dev/null "$APP_URL" || fail "next start"

node --test --test-reporter=spec --test-concurrency=1 e2e/*.test.ts 2>&1 | tee "$log/test.log"
status=${PIPESTATUS[0]}
count() { sed 's/\x1b\[[0-9;]*m//g' "$log/test.log" | sed -n "s/^ℹ $1 //p"; }
summary="tests $(count tests), pass $(count pass), fail $(count fail), skipped $(count skipped), todo $(count todo)"
if [ "$status" -eq 0 ] && [ "$(count skipped)" = 0 ]; then
  finish "E2E PASS: $summary" 0
fi
finish "E2E FAIL: $summary (logs in $log)" 1
