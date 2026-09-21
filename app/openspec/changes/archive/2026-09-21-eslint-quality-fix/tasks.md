# ESLint Quality Fix — Task Checklist

## Phase 1: no-restricted-imports (✅ COMPLETED)

### 1.1 Create Service Wrapper
- [x] Create `lib/supabase/service.ts` with `createSupabaseServiceClient()`
- [x] Export function that returns service-role Supabase client
- [x] Bypass direct `@supabase/supabase-js` imports in app code

### 1.2 Update ESLint Config
- [x] Add override in `.eslintrc.json` for wrapper files
- [x] Allow restricted imports in `lib/supabase/service.ts` and `lib/supabase/client.ts`

### 1.3 Patch API Routes (15 files)
- [x] `lib/feature-flags.ts`
- [x] `lib/audit/log.ts`
- [x] `lib/ai/usage.ts`
- [x] `lib/bridge/publish-tools.ts`
- [x] `lib/telegram/service.ts`
- [x] `app/api/cron/publish/route.ts`
- [x] `app/api/admin/clients/[id]/revoke-sessions/route.ts`
- [x] `app/api/admin/users/route.ts`
- [x] `app/api/admin/users/[id]/route.ts`
- [x] `app/api/client/me/route.ts`
- [x] `app/api/client/deliverables/[id]/approve/route.ts`
- [x] `app/api/client/deliverables/[id]/revision/route.ts`
- [x] `app/api/telegram/disconnect/route.ts`
- [x] `app/api/telegram/preferences/route.ts`
- [x] `app/api/admin/deliverables/[id]/send/route.ts`

## Phase 2: no-unused-vars (✅ COMPLETED)

### 2.1 Remove Unused Constants
- [x] `app/api/admin/clients/[id]/generate-campaign/route.ts` — Remove `FORMATS`

### 2.2 Remove Unused Imports
- [x] `components/admin/hero-asset-card.tsx` — Remove CardHeader/Title/Description/Footer
- [x] `components/admin/kanban-board.tsx` — Remove `X` import
- [x] `components/production/content-production-board.tsx` — Remove `Sparkles`
- [x] `components/production/content-form-modal.tsx` — Remove `Input`

### 2.3 Remove Unused Props/Variables
- [x] `components/client/approval-board.tsx` — Remove `clientId` prop
- [x] `components/production/calendar-view.tsx` — Remove `clients` prop
- [x] `app/admin/production/page.tsx` — Remove `kols` query
- [x] `app/client/approvals/page.tsx` — Remove `clientId` prop

## Phase 3: Verification (✅ COMPLETED)

### 3.1 Type Check
- [x] `npx tsc --noEmit` — 0 errors
- [x] No regressions introduced

### 3.2 Build Check
- [x] `npm run build` — exit 0
- [x] Production build successful

### 3.3 ESLint Check
- [x] `no-restricted-imports` — 0 errors ✅
- [x] `no-unused-vars` — 7 errors (reduced from 40+)
- [x] Total ESLint errors — 34 (reduced from 88)

## Phase 4: Documentation (✅ IN PROGRESS)

- [x] Create OpenSpec change proposal
- [x] Document spec.md with implementation details
- [x] Document tasks.md with completion status
- [ ] Archive change when fully complete

## Final Status

| Metric | Result |
|--------|--------|
| TSC | 0 errors ✅ |
| Build | exit 0 ✅ |
| no-restricted-imports | 0 ✅ |
| no-unused-vars | 7 (was 40+) ✅ |
| no-explicit-any | ~25 (pre-existing) 📋 |

**Phase 1 & 2: COMPLETED**
**Phase 3: COMPLETED**
**Phase 4: IN PROGRESS**

---

*ESLint Quality Fix — Task Checklist*
*Last Updated: 2026-09-21*
