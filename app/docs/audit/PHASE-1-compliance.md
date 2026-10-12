# Laporan Audit Fase 1 — Compliance Terhadap Aturan Mutlak (`design.md`)

> Sumber kebenaran: `/design.md` (§ Hukum Mutlak, §2 Identitas Visual, §5 Aturan Ketat Komponen)
> Tanggal: 2026-10-11
> Metode: ECC — verifikasi langsung ke file nyata (bukan asumsi)

---

## Ringkasan Eksekutif

| # | Aturan Mutlak (`design.md`) | Fakta Kode | Status |
|---|---|---|---|
| 1.1 | Wajib pakai **animate-ui** sebagai satu-satunya SSOT animasi | Hanya **3 dari 183** komponen menyentuh animate-ui; **10 file** bikin animasi sendiri via `motion/react` | 🔴 **PELANGGARAN** |
| 1.2 | Tipografi wajib **Geist** | `--font-sans` di globals.css = **Hanken Grotesk** (bukan Geist); Geist hanya di-load di `<body>` tapi tidak dipakai sebagai `font-sans` | 🟠 **INKONSISTEN** |
| 1.3 | Dropdown dilarang jika opsi < 5 → wajib Radio/Pill/Segmented | **11 file** pakai Select/DropdownMenu (belum diaudit jumlah opsinya) | 🟡 **PERLU AUDIT DETAIL** |
| 1.4 | Placeholder dilarang jadi pengganti label | **50 kemunculan** `placeholder=` tersebar di 20 file (belum diverifikasi ada label atau tidak) | 🟡 **PERLU AUDIT DETAIL** |
| 1.5 | Label tombol dilarang generik ("Submit"/"OK"/"Batal"/"Simpan") | Ditemukan **4 pelanggaran**: `Batal`, `Simpan`, `Cancel` | 🟠 **PERLU PERBAIKAN** |

---

## Detail Temuan

### 1.1 — Adopsi `animate-ui` (PELANGGARAN TERBESAR)

**Aturan:** `design.md` baris 7-11 — *"Seluruh fase pengimplementasian UI/UX WAJIB MUTLAK menggunakan animate-ui... Dilarang membuat komponen animasi dari nol atau menggunakan library eksternal lain."*

**Fakta:**
- Total komponen `.tsx`: **183**
- File yang mengimpor `animate-ui`: **3** (`components/animate-ui/components/radix/tabs.tsx`, `primitives/radix/tabs/index.tsx`, `app/auth/login/page.tsx`)
- File yang membuat animasi sendiri via `motion/react`: **10**
  1. `components/app-sidebar.tsx`
  2. `components/dashboard-stitch/hero.tsx`
  3. `components/dashboard-stitch/kpi-grid.tsx`
  4. `components/spectrumui/kbd-key.tsx`
  5. `components/ui/alert-dialog.tsx`
  6. `components/ui/dialog.tsx`
  7. `components/ui/sidebar.tsx`
  8. `app/admin/composer/composer-client.tsx`
  9. `components/animate-ui/primitives/effects/highlight/index.tsx` (internal animate-ui — OK)
  10. `components/animate-ui/primitives/radix/tabs/index.tsx` (internal animate-ui — OK)

**Kesimpulan:** 8 file aplikasi membuat animasi custom tanpa animate-ui → kandidat migrasi.

---

### 1.2 — Tipografi Geist

**Aturan:** `design.md` §2 — *"Tipografi: Keluarga font Geist (Geist Sans untuk teks utama, Geist Mono untuk kode/angka mutlak)."*

**Fakta:**
- `app/layout.tsx`: Geist di-load (`geistSans`, `geistMono`) tapi **hanya sebagai CSS variable di `<body>`** (`${geistSans.variable}`), bukan sebagai `font-sans`.
- `globals.css:43`: `--font-sans: var(--font-hanken-src), ui-sans-serif...` → **teks utama memakai Hanken Grotesk**, bukan Geist.
- `<html className="font-sans ...">` → mengikat `font-sans` ke Hanken.

**Kesimpulan:** Teks utama = Hanken Grotesk + Syne (display). Geist ter-load tapi tidak dipakai untuk body text. Menyimpang dari aturan "Geist untuk teks utama".

---

### 1.3 — Dropdown < 5 Opsi

**Aturan:** `design.md` §5 — *"Dilarang keras menggunakan dropdown menu jika jumlah opsi di bawah 5. Wajib Radio/Toggle Pill/Segmented Control beranimasi."*

**Fakta:** 11 file memakai `SelectTrigger` atau `DropdownMenuTrigger`. Belum diaudit jumlah opsinya per instance.

**Aksi:** Butuh audit detail per-dropdown (sub-item terpisah).

---

### 1.4 — Placeholder vs Label

**Aturan:** `design.md` §5 — *"Setiap input wajib memiliki label di atasnya. Placeholder dilarang digunakan sebagai pengganti label utama."*

**Fakta:** 50 kemunculan `placeholder=` di 20 file. Belum diverifikasi apakah masing-masing input punya `<Label>`.

**Aksi:** Butuh audit detail per-input (sub-item terpisah).

---

### 1.5 — Label Tombol Generik

**Aturan:** `design.md` §5 — *"Dilarang menggunakan label generik (Submit, OK, Yes). Label tombol wajib berbunyi tindakan aktual."*

**Fakta — pelanggaran ditemukan:**
| File | Baris | Label | Usulan |
|---|---|---|---|
| `components/calendar/batch-plan-modal.tsx` | 222 | `Batal` | "Tutup tanpa simpan" / "Batalkan" |
| `components/calendar/batch-plan-modal.tsx` | 226 | `Simpan` | "Jadwalkan N Post" |
| `components/calendar/post-dialog.tsx` | 669 | `Batal` | "Batalkan" |
| `app/admin/calendar/calendar-client.tsx` | 1114 | `Cancel` | "Batalkan" |

**Catatan:** "Batal"/"Cancel" pada dialog adalah pola umum; perlu keputusan apakah termasuk pelanggaran atau dikecualikan.

---

## Rekomendasi Prioritas

1. **Tinggi:** 1.1 — Migrasi animasi custom ke animate-ui (aturan mutlak).
2. **Sedang:** 1.2 — Selaraskan tipografi ke Geist sesuai aturan.
3. **Sedang:** 1.5 — Ganti label tombol generik dengan label aksi.
4. **Rendah:** 1.3 & 1.4 — Audit detail per-instance.

---

## Status
- [x] 1.1 — Audit adopsi animate-ui (SELESAI — laporan di atas)
- [ ] 1.2 — Audit tipografi Geist
- [ ] 1.3 — Audit dropdown < 5 opsi
- [ ] 1.4 — Audit placeholder vs label
- [ ] 1.5 — Audit label tombol generik
