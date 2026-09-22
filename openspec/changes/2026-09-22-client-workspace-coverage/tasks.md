# Change: Client Workspace & Dynamic Route Coverage Gap

**Date:** 2026-09-22  
**Status:** Draft  
**Author:** Damar (Agnes)

---

## Proposal

### Background

Previous session (observability-audit-trail, `a869af5e`) completed admin page sweep covering **21 static admin routes**. All 51 E2E tests passed. However, 4 critical gaps remained uncovered:

1. **4 dynamic admin `[id]` routes** never visited by any test suite
2. **7 client portal pages** never tested with authenticated client session
3. **Workspace page `/admin/clients/[id]`** causes server hang — known issue from `MaxListenersExceededWarning` (Sentry tunnel route listener leak)

### Objective

Close coverage gap for dynamic routes and client portal. Document findings factually, no assumptions.

### Scope

- Add new E2E spec: `e2e/admin-client-dynamic-routes.spec.ts`
- Run sweep against all uncovered routes
- Document bugs found with evidence and wiring for future fix

---

## Specifications

### ADDED Requirements: Coverage Test Suite

#### Requirement: Dynamic Admin Routes Shall Be Swept
- Every dynamic admin route pattern `[id]` SHALL be tested in E2E
- Route patterns: `/admin/clients/[id]`, `/admin/crm/[id]`, `/admin/deliverables/[id]`, `/admin/skills/[id]`
- Tests SHALL use env vars for credentials (no hardcoded values)
- Tests SHALL check HTTP status < 500, no auth bounce, no error markers

#### Requirement: Client Portal Pages Shall Be Swept
- Every client portal page SHALL be tested with authenticated client session
- Pages: `/client/dashboard`, `/client/deliverables`, `/client/calendar`, `/client/pipeline`, `/client/settings`, `/client/approvals`, `/client/deliverables/[id]`
- Tests SHALL verify page renders (h1 or h2 present)
- Tests SHALL check for console errors and page errors

#### Requirement: Server Stability Test
- Server SHALL respond to health check after each test suite
- If server hangs (no response after 8s), it SHALL be noted as critical bug

---

## Design

### Approach
- Use same per-test auth pattern as `e2e/admin-sweep.spec.ts`
- Admin: resolve first client ID from `/admin/clients` list DOM
- Client: direct login, then navigate each page
- Use `domcontentloaded` instead of `networkidle` (client pages have realtime websocket)
- Document server hang if observed

### Architecture Constraints
- Client portal uses `DeliverableNotifier` (Supabase Realtime websocket) → `networkidle` never settles
- Workspace page runs 13 parallel Supabase queries → potential bottleneck
- Sentry `tunnelRoute` adds close listeners without cleanup → accumulation on heavy load

---

## Tasks

- [ ] Write `e2e/admin-client-dynamic-routes.spec.ts` (108 lines)
- [ ] Run admin dynamic routes sweep (6 tests)
- [ ] Run client portal sweep (7 tests)
- [ ] Verify server stability before/after each suite
- [ ] Document all findings in tasks.md with facts, not assumptions
- [ ] Create commits for test changes

---

## Findings Summary

### Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| `e2e/admin-client-dynamic-routes.spec.ts` | 13 | **FAILED** |

### Bugs Found

| # | Bug | Location | Evidence | Severity |
|---|-----|----------|----------|----------|
| 1 | `/admin/clients/[id]` server hang | `app/admin/clients/[id]/page.tsx` + `workspace.tsx` | Port listening but 0 bytes response (curl timeout). Server PID 15164 accepted connections but event loop blocked. | **Critical** |
| 2 | `networkidle` timeout on client pages | `app/client/layout.tsx` | `DeliverableNotifier` subscribes to Supabase Realtime → `networkidle` never settles | Medium |
| 3 | Spec test bug: `beforeAll` page fixture | `e2e/admin-client-dynamic-routes.spec.ts` | Playwright error: "context and page fixtures are not supported in beforeAll" | Low (self-fix) |

### Root Cause Analysis

**Bug #1 — Server Hang on Workspace Load:**
- Workspace page runs 13 parallel `safeQuery()` calls to Supabase
- Likely one query hangs indefinitely (table missing? RLS blocking?)
- Server accepts connections but cannot complete request
- Confirmed: PID 15164, port 3004 listening, but all requests timeout

**Queries executed by workspace:**
1. `clients` (WHERE id = ?)
2. `deliverables` (WHERE client_id = ?)
3. `skill_packs` (ORDER BY sort_order)
4. `skills` (SELECT all)
5. `pack_skills` (SELECT all links)
6. `client_skills` (WHERE client_id = ?)
7. `client_files` (WHERE client_id = ?) — path only
8. `client_files` (WHERE client_id = ? AND path = 'brand-profile.md')
9. `pipeline_stages` (ORDER BY sort_order)
10. `skills` (stage-filtered)
11. `skill_guardrails` (SELECT all)
12. `repo_ground_truths` (ORDER BY sort_order)
13. `client_channels` (WHERE client_id = ?)
14. `skill_outputs` (WHERE client_id = ?)
15. `ai_providers` (WHERE is_default = true)

**Potential blocking tables:**
- `client_files` — may not exist or RLS blocks
- `pipeline_stages` — may not exist
- `skill_guardrails` — may not exist
- `repo_ground_truths` — may not exist
- `client_channels` — may not exist
- `skill_outputs` — may not exist

**Recommendation:** Probe tables via PostgREST to verify existence.

---

## Wiring Fixes Required

### Fix 1: Server Hang — Identify Blocking Query
**Wiring:** Add per-query timeout or separate error boundary for workspace data loading.
```typescript
// In page.tsx, wrap each safeQuery with timeout:
const timeout = 5000
const safeQueryWithTimeout = async (fn) => {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), timeout))
    ])
  } catch (e) { ... }
}
```

### Fix 2: Client Portal Test Strategy
**Wiring:** Change test assertions from `waitForLoadState('networkidle')` to `waitForSelector('h1')`.
```typescript
// Current (broken):
await page.goto('/client/dashboard', { waitUntil: 'networkidle' })
// Fixed:
await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('h1')
```

### Fix 3: Spec Test Pattern
**Wiring:** Move client ID resolution into individual test cases (not beforeAll).
```typescript
// Current (broken - beforeAll with page fixture):
test.beforeAll(async ({ page }) => { ... })
// Fixed - per-test resolution:
test('workspace loads', async ({ page }) => {
  const clientId = await page.locator('a[href*="/admin/clients/"]').first().getAttribute('href')
  // ... use clientId
})
```

---

## Infrastructure Notes

- Server hang likely caused by Sentry tunnel route listener leak accumulating
- Workaround: restart server between test suites
- Test credentials stored in `.env.local` (untracked)
- No .auth files committed (gitignored)

---

## Verification Criteria

- [ ] All 4 dynamic admin routes load without 5xx (when server healthy)
- [ ] All 7 client portal pages render (h1/h2 visible)
- [ ] No hardcoded credentials in any test file
- [ ] Server health check passes before and after each suite
- [ ] Console errors logged (not just pass/fail)
- [ ] Server hang bug documented with PID and symptom
