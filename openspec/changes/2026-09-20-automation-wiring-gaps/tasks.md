# Tasks: Automation Wiring Gaps

## Phase 1: Register Missing Cron Jobs (CRITICAL) — 0.5 hr
- [x] Add `/api/cron/publish` to `app/vercel.json` (schedule `* * * * *`)
- [x] Add `/api/cron/check-zero-metrics` to `app/vercel.json` (schedule `0 7 * * *`)
- [x] Keep `daily-insight` entry (`0 1 * * *`)
- [x] Update `app/app/vercel.json` (mirror config) if it also deploys

## Phase 2: Add CRON_SECRET to daily-insight (HIGH) — 0.5 hr
- [x] Import `CRON_SECRET` from env
- [x] Add `Authorization: Bearer <CRON_SECRET>` check before any logic
- [x] Return 401 if header missing/incorrect
- [x] Remove the current inverted `getUser()` guard (or keep as defense-in-depth AFTER secret check)

## Phase 3: Wire PostDialog in hasil.tsx (MEDIUM) — 0.5 hr
- [x] Change `hasil.tsx` PostDialog `onSave` to refetch scheduled posts for that client
- [x] Or call a refresh callback prop if parent exposes one

## Phase 4: Verify Automation Chain — 1 hr
- [x] Confirm `vercel.json` lists all 3 crons
- [x] `npx tsc --noEmit` passes
- [x] PostDialog in Hasil tab: after save, Calendar shows post without F5

## Phase 5: Documentation — 0.5 hr
- [x] `vercel.json` updated with final 3 cron jobs configuration
- [x] `app/vercel.json` mirror updated
