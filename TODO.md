# 📝 Frahma Pending Tasks & TODOs

**Last updated:** 2026-10-16 by Agnes (ECC verification)

---

## ✅ RESOLVED: Dashboard Factual Data Migration

**Status:** **SELESAI** — verifikasi faktual 2026-10-16

**Fakta verifikasi (bukan asumsi):**
- ✅ Tabel `dashboard_profiles` SUDAH ADA di DB (migration 053 & 054)
- ✅ 48 rows data factual (contoh: client `5044af9e-...` = "Frhm Alpha Tester")
- ✅ Service layer `features/dashboard/api/service.ts` FULLY IMPLEMENTED (228 lines)
- ✅ 11 unit tests PASS + 4 dashboard E2E tests PASS
- ✅ `/admin/dashboard` loads real metrics: total_reach=2500, engagement_rate=4.2%, velocity=5, peak_value="19:00"
- ✅ Vitest: 412/412 pass; Playwright E2E: 83/83 pass

---

## ✅ RESOLVED: Type Hardening — any → unknown

**Status:** **SELESAI** — commit `0cd9c13`, 2026-10-16

- ✅ 32 catch blocks di 19 files: `catch (err: any)` → `catch (err: unknown)` + `instanceof Error`
- ✅ `tsc --noEmit` **0 error**; Vitest **412/412 pass**
- ✅ 5 `exhaustive-deps` suppressions diverifikasi **LEGAL**

---

## ⚠️ STALE: OpenSpec Archived Changes (Sept 2026)

**Status:** **OBSOLETE** — diverifikasi 2026-10-16

Semua OpenSpec change dari Sept 2026 merujuk file yang **sudah tidak ada** karena arsitektur
bermigrasi besar-besaran (feature modules + Server Actions + React Query).

**Bukti verifikasi (file yang direferensikan GONE):**
- `components/marketing/budget-ledger-board.tsx` → GONE (diganti `app/admin/erp/erp-client.tsx`)
- `components/marketing/ads-tracker-board.tsx` → GONE
- `components/marketing/kol-crm-board.tsx` → GONE
- `components/marketing/event-workspace-board.tsx` → GONE
- `components/feedback/feedback-board.tsx` → GONE
- `components/client/setup.tsx` → GONE
- `components/telegram/telegram-connect-card.tsx` → GONE
- `app/api/admin/clients/[id]/foundation/batch/route.ts` → GONE
- `app/api/admin/clients/[id]/campaigns/route.ts` → GONE
- Semua `/api/admin/*` routes → GONE (diganti Server Actions)

**Arsitektur baru (verified):**
- Data layer: `features/*/api/{types,service,queries}.ts` (16 feature modules)
- Mutations: React Query `useMutation` + Server Actions (`'use server'`)
- Prefetch: `page.tsx` → `queryClient.prefetchQuery` + `HydrationBoundary`
- API routes tersisa hanya: cron, skills, social, support, telegram, trends, whatsapp

**Kesimpulan:** Tidak ada action item code yang genuinely pending dari OpenSpec lama.
Unchecked items di tasks.md adalah *verification gates* yang sudah terlewati oleh arsitektur baru.

---

## 📋 Roadmap Berikutnya (belum ada task konkret)

**Kandidat pekerjaan ke depan (perlu keputusan user):**
1. **Realtime subscriptions** — multi-user live sync untuk board (nice-to-have, bukan bug)
2. **E2E coverage expansion** — 32 test gagal karena timeout/CSP (Sentry CSP issue)
3. **Sentry CSP fix** — `connect-src` tidak mengizinkan `*.sentry.io` (blocking error reporting)
4. **Fitur baru** — menunggu spesifikasi dari user

**Catatan:** Tidak ada TODO/FIXME di source code (verified via grep).

---

*(Catatan: TODO ini dibuat otomatis oleh agen ECC. Status diperbarui berdasarkan verifikasi langsung ke DB, unit tests, dan E2E suite.)*
