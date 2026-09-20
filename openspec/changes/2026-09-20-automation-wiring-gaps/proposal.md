# Proposal: Automation Wiring Gaps

## Overview

Deep-dive into the automation layer (cron jobs, Telegram webhooks, bridge publishing, PostDialog scheduling) revealed **5 gaps** that break the "automation" promise of the SaaS. These differ from earlier findings (security, tables, cross-tab refresh): they concern **background processes that exist in code but never actually run**, and **forms whose success never propagates to their consumers**.

## Issue A1: `/api/cron/publish` NOT Registered (CRITICAL)

**Problem:**
`app/vercel.json` registers only **one** cron:
```json
{ "crons": [{ "path": "/api/cron/daily-insight", "schedule": "0 1 * * *" }] }
```

But **3 cron routes exist** on disk:
- `app/api/cron/daily-insight/route.ts` ✅ registered
- `app/api/cron/publish/route.ts` ❌ **NOT registered**
- `app/api/cron/check-zero-metrics/route.ts` ❌ **NOT registered**

**Impact:** The entire **automated posting feature does not work**. Content scheduled via PostDialog with `status='scheduled'` will NEVER be published, because nothing calls `/api/cron/publish`. The docs (`app/docs/SCHEDULED_PUBLISH.md`) even specify the intended Vercel Cron config — but it was never added to `vercel.json`.

The escalation monitor (`check-zero-metrics`) never runs either.

**Files:**
- `app/vercel.json` — missing 2 cron entries
- `docs/SCHEDULED_PUBLISH.md` — documents intended behavior

## Issue A2: `daily-insight` Cron Has No SECRET Auth (HIGH)

**Problem:**
`app/api/cron/daily-insight/route.ts` guards with:
```ts
const { data: { user } } = await supabase.auth.getUser()
if (user) return NextResponse.json({ error: 'Internal endpoint only' }, { status: 403 })
```
This **rejects requests WITH a session** and allows requests WITHOUT one. Vercel Cron sends NO session cookie — so it passes. But so does **any anonymous caller**. There is NO `CRON_SECRET` check, unlike `publish` and `check-zero-metrics` which use `Authorization: Bearer <CRON_SECRET>`.

**Impact:** Anyone can trigger the daily insight generation (costly AI calls, Telegram spam to all clients) by curling the URL.

**Fix:** Add `CRON_SECRET` bearer check, same as other cron routes.

## Issue A3: PostDialog Uses `onDelete={onSave}` in Calendar (HIGH)

**Problem:**
`app/admin/calendar/calendar-client.tsx`:
```tsx
<PostDialog
  onSave={handleSave}
  onDelete={handleSave}   // ← delete reuses save handler
/>
```
`handleSave` = `await loadPosts(selectedClientId)` — it refetches. The actual delete already happened via `DELETE /api/admin/scheduled-posts?id=...` inside PostDialog, so refetch after delete is *functionally correct*. **Verdict: NOT a bug** — the naming is misleading but behavior is right. Excluded as false positive after verification.

## Issue A4: PostDialog Wiring Is Inconsistent Across Usages (MEDIUM)

**Problem:**
The same `PostDialog` component is wired **differently** in its 3 usages:

| Usage | onSave | Result |
|-------|--------|--------|
| `calendar-client.tsx` | `loadPosts()` refetch | ✅ fresh |
| `hasil.tsx` | closes dialog + sets `calendarOutput` | ⚠️ no refetch, just UI close |
| `content-production-board.tsx` | `fetchProductions()` | ✅ fresh |

**Impact:** In `hasil.tsx`, creating a post from the Hasil tab does not refetch anything — the scheduled post only appears in Calendar on next load. Minor inconsistency.

## Issue A5: Client Approve → Auto-Publish Chain Is Correct But Untestable (VALIDATED OK)

**Verification result:** `approve/route.ts` does update status, triggers publish-ish path, notifies Telegram. The chain client-approve → status change → cron/publish works **only if** cron/publish is registered (Issue A1). Its correctness depends entirely on fixing A1.

## Root Cause

The `vercel.json` was configured early (only daily-insight), then `publish` and `check-zero-metrics` routes were added later without re-registering the scheduler. Classic "code exists, deployment config lags" gap.

## Fix Strategy

1. **Register both missing crons** in `app/vercel.json`:
```json
{ "crons": [
  { "path": "/api/cron/daily-insight", "schedule": "0 1 * * *" },
  { "path": "/api/cron/publish", "schedule": "* * * * *" },
  { "path": "/api/cron/check-zero-metrics", "schedule": "0 7 * * *" }
]}
```
2. **Add CRON_SECRET check** to `daily-insight` (align with publish/check-zero-metrics pattern)
3. **Wire PostDialog onSave in hasil.tsx** to refetch or at least call a refresh callback
4. **Verify** publish cron triggers a real Bridge post in staging

## Prioritization

- **Must fix:** A1 (auto-publish dead), A2 (unauthenticated cron)
- **Should fix:** A4 (hasil.tsx wiring)
- **Already correct:** A3 (false positive), A5 (depends on A1)