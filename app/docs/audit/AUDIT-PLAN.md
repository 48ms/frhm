# 🎯 AUDIT PLAN — FRHM SaaS UI/UX (Menyeluruh & Terstruktur)

> Metode: **ECC** (Plan → Execute → Verify) · Prinsip: **1 sub-item per giliran**, tuntas lalu lanjut
> Sumber kebenaran desain: `/design.md`
> Output: **file laporan terpisah per fase** (di `docs/audit/`)

---

## Inventarisasi Fakta Awal (baseline)

| Metrik | Nilai |
|---|---|
| Admin routes (`page.tsx`) | 16 |
| Total komponen `.tsx` | 183 |
| `loading.tsx` coverage | 16/16 (100%) ✅ |
| `error.tsx` coverage | 16/16 + global (100%) ✅ |
| File mengimpor `animate-ui` | 3 / 183 🔴 |
| File animasi custom (`motion/react`) | 10 |
| Hardcoded hex di `.tsx` | 7 ⚠️ |
| File dgn gradient/blur glow | 10 ⚠️ |
| Unit test | 180 passing ✅ |

---

## FASE 1 — Compliance Audit (Aturan Mutlak `design.md`)
📄 Laporan: `docs/audit/PHASE-1-compliance.md`

- [x] **1.1** Audit adopsi `animate-ui` + kepatuhan Hukum Mutlak → 🔴 3/183 (selesai, terlaporkan)
- [x] **1.2** Audit tipografi (wajib Geist) → di-update: Hanken Grotesk body, Geist Mono kode/angka, token `--font-mono` ditambahkan (SELESAI)
- [x] **1.3** Audit dropdown < 5 opsi (harus Pill/Segmented) → 🔴 Pelanggaran ditemukan pada theme-selector & calendar view (selesai, terlaporkan)
- [x] **1.4** Audit placeholder vs label → 🔴 Pelanggaran ditemukan pada banyak form (selesai, terlaporkan)
- [x] **1.5** Audit label tombol generik → 🔴 Pelanggaran ditemukan pada banyak form (selesai, terlaporkan)

## FASE 2 — Design Token & Konsistensi Warna
📄 Laporan: `docs/audit/PHASE-2-tokens.md`

- [x] **2.1** Audit & Bersihkan hardcoded hex → Token `--platform-*` dibuat; `composer-client.tsx` + `calendar-client.tsx` dimigrasi (SELESAI)
- [x] **2.2** Verifikasi token `admin-stage.css` ↔ `globals.css` ↔ palet logo (SELESAI)
- [ ] **2.3** Cek kontras WCAG (normal/hover/active/disabled)

## FASE 3 — Layout & Komponen Inti
📄 Laporan: `docs/audit/PHASE-3-*.md`

- [x] **3.1** Header (dead-space area tanda merah) (SELESAI)
- [x] **3.2** Sidebar (finalisasi) (SELESAI)
- [x] **3.3** Dashboard & kartu KPI (Angka → Geist Mono) (SELESAI)
- [x] **3.4** ERP Dashboard (dead class `font-headline-*` → `admin-headline-*`, angka → `font-mono`, preview-erp SSR crash fixed) (SELESAI)
- [x] **3.5** Social Accounts (Audit selesai — TIDAK ADA PELANGGARAN KRITIS) (SELESAI)
- [x] **3.6** Composer (2 hardcoded hex hover → token `--admin-cobalt`) (SELESAI)
- [x] **3.7** Content Calendar (Tombol generik → deskriptif, hardcoded blue → token, Priority Select 4 opsi → segmented pill) (SELESAI)
- [x] **3.8** Analytics (4 KPI value `font-syne` → `font-mono`) (SELESAI)

## FASE 4 — Resilience
📄 Laporan: `docs/audit/PHASE-4-*.md`

- [x] **4.1** Audit skeleton loading (9/10 konsisten; composer/loading direfactor) (SELESAI)
- [x] **4.2** Audit empty & error states (konsisten) (SELESAI)
- [x] **4.3** Audit toast & feedback (TIDAK ADA toast; feedback via modal/dialog — terverifikasi) (SELESAI)
- [ ] **4.4** Optimistic UI (design.md §3) — mutation masih pakai `invalidateQueries`, belum optimistic

## FASE 5 — Mobile & Aksesibilitas
📄 Laporan: `docs/audit/PHASE-5-*.md`

- [x] **5.1** Audit mobile responsiveness (breakpoints konsisten) (SELESAI)
- [ ] **5.2** Audit aksesibilitas (aria-label parsial; contrast belum diverifikasi) — SEDANG BERJALAN
- [ ] **5.3** Touch target ≥ 44px
- [ ] **5.4** Focus visible state
- [ ] **5.5** Bottom-nav untuk client portal (design.md §4)
- [ ] **5.6** Data density toggle (design.md §3)

## FASE 6 — Audit UI Mendalam (Area Belum Tersentuh)
📄 Plan: `docs/audit/DEEP-AUDIT-MASTER-PLAN.md`

- [ ] **A** Audit Komponen Tersembunyi & Modal Dialog (tombol generik, padding/radius/shadow, kontras muted)
- [ ] **B** Audit Tipografi & Skala Font Lanjutan (angka → mono, headline → Syne, body → Hanken)
- [ ] **C** Audit Interaktivitas & State (touch target kecil, focus-visible ring, hardcoded hex sisa)
- [ ] **D** Verifikasi Akhir (TSC, Vitest, Next Build)

---

## Aturan Kerja
1. **1 sub-item per giliran** — kerjakan sampai tuntas, verifikasi (tsc + vitest), baru lanjut.
2. **ECC**: setiap klaim diverifikasi dari file nyata, bukan asumsi.
3. **Anti-slop**: hapus hardcoded warna, glow/gradient berlebihan, animasi custom bila animate-ui menyediakan.
4. **Verifikasi**: `npx tsc --noEmit` + `npx vitest run` harus hijau setiap selesai sub-item.
