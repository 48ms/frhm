# Tasks: Automation Wiring Gaps

## Phase 1: Register Missing Cron Jobs (CRITICAL) — 0.5 hr
- [x] Add `/api/cron/publish` to `app/vercel.json` (schedule `* * * * *`)
- [x] Add `/api/cron/check-zero-metrics` to `app/vercel.json` (schedule `0 7 * * *`)
- [x] Keep `daily-insight` entry (`0 1 * * *`)
- [x] Update `app/app/vercel.json` (mirror config) if it also deploys

## Phase 2: Add CRON_SECRET to daily-insight (HIGH) — 0.5 hr
- [x] Import `CRON_SECRET` from env
- [x] Add `Authorization: Bearer ***` check before any logic
- [x] Return 401 if header missing/incorrect
- [x] Remove the current inverted `getUser()` guard (or keep as defense-in-depth AFTER secret check)

## Phase 3: Wire PostDialog in hasil.tsx (MEDIUM) — 0.5 hr
- [ ] Change `hasil.tsx` PostDialog `onSave` to refetch scheduled posts for that client
- [ ] Or call a refresh callback prop if parent exposes one

## Phase 4: Verify Automation Chain — 1 hr
- [ ] Confirm `vercel.json` lists all 3 crons
- [ ] `npx tsc --noEmit` passes
- [ ] Local test: `curl -X POST /api/cron/publish -H "Authorization: Bearer $CRON_SECRET"` returns 200
- [ ] Local test: `curl /api/cron/daily-insight` WITHOUT secret returns 401
- [ ] Local test: `curl /api/cron/daily-insight` WITH secret returns 200
- [ ] PostDialog in Hasil tab: after save, Calendar shows post without F5

## Phase 5: Documentation — 0.5 hr
- [ ] Update `docs/SCHEDULED_PUBLISH.md` with final vercel.json (if changed)
- [ ] Archive change when verified