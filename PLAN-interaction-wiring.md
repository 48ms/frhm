# PLAN — Wiring Interaksi MVP (ECC: Plan-Before-Execute)

> Disusun via audit statis 107 file UI. Status: **DRAFT — menunggu keputusan store.**
> Prinsip ECC: plan → test → implement → review → verify → remember → improve.

---

## 0. TEMUAN AUDIT (fakta, bukan asumsi)

Audit scan `<button` + `onClick` + modal + form di 5 halaman MVP + komponen dashboard:

| Halaman / Komponen | Tombol punya onClick | Masalah sebenarnya |
|---|---|---|
| `dashboard-stitch/post-pipeline.tsx` | **0 / 2** ❌ | **Mati total.** `POSTS` hardcoded, tidak client-aware, "Add Post" & "View Calendar" tidak ada handler. |
| `dashboard-stitch/right-panel.tsx` | 6 / 7 | Disconnect akun = local state; "Details" tidak wired; picker pakai local state (bukan URL). |
| `dashboard-stitch/hero.tsx` | 4 / 4 ✅ | Sudah benar — client switcher via `?clientId=` (nuqs). |
| `dashboard-stitch/kpi-grid.tsx` | — | Sudah reaktif ke `useActiveDashboard()`. |
| `dashboard-stitch/performance-chart.tsx` | — | Sudah benar — `?tf=` nuqs + hover. |
| `social-accounts-board.tsx` | 9 / 9 | onClick ada, tapi `accounts` = **local useState** → mutasi hilang saat refresh. |
| `campaigns-board.tsx` | 6 / 6 | onClick ada, tapi `campaigns` = **local useState(CAMPAIGNS)** → create/edit hilang saat refresh. |
| `calendar-client.tsx` | 5 / 5 | Paling matang — sudah pakai TanStack Query + `features/calendar/service.ts`. |
| `analytics/campaign-analytics-view.tsx` | 5 / 5 | Filter sudah URL state; sisanya statis. |

**Modal form (export / schedule / ai-hook / connect-channel):** semua pakai simulasi `phase: idle → working → done`, **tidak menulis** ke list mana pun. Submit = tutup modal.

---

## 1. AKAR MASALAH (root cause)

Interaksi tersebar di **3 pola berbeda** tanpa sumber kebenaran tunggal:

1. **URL state (nuqs)** — benar, tapi hanya untuk *view state* (filter/tab/client).
2. **Local `useState`** — mutasi hilang saat refresh & tidak nyambung antar-halaman (hapus campaign di Campaigns → masih muncul di Dashboard).
3. **Array hardcoded** — tidak bisa berubah sama sekali (`post-pipeline.tsx`).

Akibatnya: **submit form tidak mengubah daftar.** Ini yang bikin "bingung interaksinya kemana" — karena memang tidak kemana-mana.

---

## 2. ARSITEKTUR TARGET (3 lapis, sesuai Aturan)

```
┌─ Layer 3: VIEW STATE (URL / nuqs) ──────────────────┐
│  ?clientId=  ?tf=  ?status=  ?view=  ?campaignId=   │  ← filter, tab, selected, modal open
└──────────────────────┬──────────────────────────────┘
                       │ baca
┌─ Layer 2: CLIENT STORE (mutable, in-memory) ────────┐
│  campaigns · accounts · posts · clients             │  ← create / edit / delete / approve
│  seed dari Mock Repository                          │     hidup selama 1 sesi (SPA nav)
└──────────────────────┬──────────────────────────────┘
                       │ seed
┌─ Layer 1: MOCK REPOSITORY (lib/mock-data.ts) ───────┐
│  data dummy deterministik (sudah ada)               │  ← nanti diganti query Supabase asli
└─────────────────────────────────────────────────────┘
```

**Aturan pembagian (mutlak):**
- **Membaca/mengubah data** → Store.
- **Menyimpan pilihan tampilan** (filter, tab, modal mana yang terbuka) → URL state (`nuqs`).
- **Data mentah** → Mock Repository.

**Konsolidasi data yang sekarang berserakan:**
`campaign-data.ts` + `social-data.ts` + `dashboard-data.ts` + `lib/mock-data.ts` → satu repo + satu store.

---

## 3. INVENTARIS INTERAKSI YANG HARUS DI-WIRE

### Halaman 1 — Dashboard
| Elemen | Aksi target |
|---|---|
| `post-pipeline` → "Add Post" | Buka `SchedulePostModal` → submit → **post baru masuk list** |
| `post-pipeline` → "View Calendar" | Navigasi `/admin/calendar?clientId=…` |
| `post-pipeline` → tiap baris post | Klik → buka detail / edit post |
| `post-pipeline` → POSTS | Ganti hardcode → baca dari Store (filter by client) |
| `right-panel` → tombol X (disconnect) | Hapus akun dari Store + toast |
| `right-panel` → "Details" | Buka modal detail akun |
| `right-panel` → client picker | Pindah ke URL state (`?clientId=`) |
| `hero` → Export Report | `ExportReportModal` → submit → **unduh file nyata** (CSV/PDF/MD) |
| `hero` → Schedule Post | Submit → masuk Store + toast |
| `hero` → AI Hook | Generate → copy → (opsional) sisip ke post |

### Halaman 2 — Social Accounts
| Elemen | Aksi target |
|---|---|
| "Connect Channel" (3 titik) | Wizard → pilih platform → OAuth simulasi → **akun masuk Store** |
| Tiap kartu akun → Refresh token | Simulasi refresh + update `expiresAt` di Store |
| Tiap kartu → Disconnect | Hapus dari Store + konfirmasi |
| Client picker | URL state |
| Tab filter | URL state |

### Halaman 3 — Campaigns
| Elemen | Aksi target |
|---|---|
| "Create Campaign" (2 titik) | `CampaignModal` → validasi Zod → **masuk Store** |
| Kartu → Edit | `CampaignModal` mode edit → **update Store** |
| Kartu → klik | `CampaignDetailModal` (detail + metrik) |
| Filter klien/tipe | URL state (sudah) |

### Halaman 4 — Calendar
| Elemen | Aksi target |
|---|---|
| "New Post" | `PostDialog` → submit → mutasi TanStack Query (sudah jalan) |
| Export | `CalendarExportModal` → **unduh file nyata** |
| View month/week/list | URL state (sudah) |

### Halaman 5 — Analytics
| Elemen | Aksi target |
|---|---|
| Filter status | URL state (sudah) |
| Reset filter | URL state (sudah) |
| Kartu campaign | Klik → drill-down / navigasi ke detail |

---

## 4. FASE EKSEKUSI (kecil, teruji, tiap fase = 1 commit)

- **Fase 0 — Fondasi Store** *(blocking, kerjakan pertama)*
  - Buat `lib/store/` (atau pilih zustand). Seed dari Mock Repository.
  - Tulis **test dulu** (TDD): create/edit/delete campaign & account benar-benar mengubah state.
  - Verify: `tsc + eslint + vitest` hijau.

- **Fase 1 — Dashboard** (prioritas: `post-pipeline` 0/2)
  - Wire 2 tombol mati + baris post + right-panel Details/Disconnect + picker→URL.
  - Verify: klik Add Post → post muncul → refresh → masih ada.

- **Fase 2 — Social Accounts**: connect wizard + disconnect + refresh → Store.

- **Fase 3 — Campaigns**: create/edit/detail → Store; hapus local useState.

- **Fase 4 — Calendar**: samakan pola export (unduh nyata) + konsisten dengan Store.

- **Fase 5 — Analytics**: drill-down campaign → detail.

- **Fase 6 — Konsistensi lintas-halaman**: hapus campaign di Campaigns → hilang di Dashboard & Analytics.

---

## 5. DEFINITION OF DONE (verification-loop)

Setiap fase dianggap selesai HANYA jika:
1. `npx tsc --noEmit` → 0 error
2. `npx eslint .` → 0 error
3. `npx vitest run` → semua pass (test baru untuk mutasi store)
4. `npx next build` → sukses
5. **Manual:** tiap tombol yang di-wire punya efek yang **bisa dilihat** dan **bertahan saat navigasi antar-halaman** (bukti: langkah reproduksi, bukan klaim).

---

## 6. DI LUAR SCOPE (scope guard)

- ❌ Query Supabase asli (data tetap dummy — sesuai keputusan "fast prototype").
- ❌ E2E Playwright (ditunda).
- ❌ Refactor `features/*/api/` (35 `fetch()` langsung).
- ❌ 41 lint error pre-existing di 22 file lama.

---

## 7. KEPUTUSAN YANG DIBUTUHKAN

**Pilihan mekanisme Store** (Fase 0):

| Opsi | Pro | Kontra |
|---|---|---|
| **A. zustand** *(rekomendasi)* | 1 KB, API minimal, pilih state tanpa boilerplate, standar industri | +1 dependency |
| B. React Context + useReducer | 0 dependency | boilerplate lebih banyak, re-render lebih luas |
| C. Perpanjang TanStack Query | sudah dipakai di Calendar | dipaksa untuk data client-only, agak menyalahi tujuan |

→ **Rekomendasi: Opsi A (zustand)**, konsisten dengan "fast prototype" & minim refactor.
