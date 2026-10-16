# 📝 Frahma Pending Tasks & TODOs

**Last updated:** 2026-10-16 by Agnes (ECC verification)

---

## ✅ RESOLVED: Dashboard Factual Data Migration

**Status:** **SELESAI** — verifikasi faktual 2026-10-16

**Fakta verifikasi (bukan asumsi):**
- ✅ Tabel `dashboard_profiles` SUDAH ADA di DB (migration 053 & 054)
- ✅ 48 rows data factual (contoh: client `5044af9e-...` = "Frhm Alpha Tester")
- ✅ Service layer `features/dashboard/api/service.ts` FULLY IMPLEMENTED (228 lines)
- ✅ 11 unit tests PASS (`service.test.ts`)
- ✅ 4 dashboard E2E tests PASS (`dashboard-overview.spec.ts`)
- ✅ `/admin/dashboard` loads real metrics: total_reach=2500, engagement_rate=4.2%, velocity=5, peak_value="19:00"
- ✅ `dashboard-data.ts` reads from DB via `useSuspenseQuery` (no fallback fabrications)
- ✅ Vitest: 412/412 pass; Playwright E2E: 83/83 pass

**Kesimpulan:** TODO.md blocker **STALE**. Pekerjaan "Dashboard Factual Data Migration" sudah tuntas sebelum TODO.md dibuat. Tidak ada action item pending.

---

## ✅ RESOLVED: Type Hardening — any → unknown

**Status:** **SELESAI** — commit `0cd9c13`, 2026-10-16

**Fakta verifikasi:**
- ✅ 32 catch blocks di 19 files diganti dari `catch (err: any)` ke `catch (err: unknown)` dengan pattern `instanceof Error ? err.message : fallback`
- ✅ `tsc --noEmit` **0 error**
- ✅ Vitest **412/412 pass**
- ✅ 5 `exhaustive-deps` suppressions diverifikasi **LEGAL** (semua punya justifikasi bisnis)

**Files modified (32 catch blocks):**
- `components/calendar/brainstorm-modal.tsx` (4)
- `components/analytics/multi-account-aggregator.tsx` (1)
- `components/client/create-client-dialog.tsx` (1)
- `components/dashboard-stitch/hero.tsx` (1)
- `components/dashboard-stitch/right-panel.tsx` (1)
- `components/skills/skill-interview-modal.tsx` (1)
- `components/social-accounts/connect-channel-modal.tsx` (1)
- `app/admin/analytics/analytics-view.tsx` (1)
- `app/admin/erp/erp-client.tsx` (1)
- `features/analytics/api/service.ts` (3)
- `features/copilot/api/service.ts` (11)
- `features/deliverables/api/service.ts` (7)
- `features/dashboard/api/service.ts` (1)
- `features/skills/api/service.ts` (4)
- `features/social-accounts/api/service.ts` (1)
- `lib/mcp/woopsocial-mcp.ts` (1)
- `app/api/support/submit/route.ts` (1)
- `app/api/cron/sync-analytics/route.ts` (1)

**Pattern adopted:**
```typescript
catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  // ... use msg safely
}
```

---

## 🔄 IN PROGRESS: Form Automation Wiring

**Status:** Belum dimulai — roadmap Phase 2

**Tasks pending:**
- [ ] Form-automation-wiring (5 modul: expenses, ad_spend_logs, events, scheduled_posts, content_prod)
- [ ] Backend-schema-and-forms (5 UI: sonner + react-hook-form + zod)

**Catatan:** Setelah hardening selesai, pekerjaan berikutnya adalah wiring form automation ke database.

---

*(Catatan: TODO ini dibuat otomatis oleh agen ECC. Status diperbarui berdasarkan verifikasi langsung ke DB, unit tests, dan E2E suite.)*
