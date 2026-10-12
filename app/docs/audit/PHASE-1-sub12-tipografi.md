# Laporan Audit Sub-item 1.2 — Tipografi (Wajib Geist)

> Aturan mutlak (`design.md` §2): *"Tipografi: Keluarga font Geist (Geist Sans untuk teks utama, Geist Mono untuk kode/angka mutlak)."*
> Tanggal: 2026-10-11
> Metode: verifikasi langsung ke `app/layout.tsx`, `globals.css`, dan pemakaian di komponen.

---

## Temuan

### T-1 — `--font-sans` BUKAN Geist (PELANGGARAN ATURAN MUTLAK)

**Fakta:**
- `app/layout.tsx:31-40` — Geist Sans & Geist Mono di-load sebagai `localFont`:
  - `geistSans` → variable `--font-geist-sans`
  - `geistMono` → variable `--font-geist-mono`
- `app/layout.tsx:54` — variable dilekatkan ke `<body>`: `${geistSans.variable} ${geistMono.variable}`
- `globals.css:43` — **tapi `--font-sans` di-override ke Hanken Grotesk**:
  ```css
  --font-sans: var(--font-hanken-src), ui-sans-serif, system-ui, sans-serif;
  ```
- `app/layout.tsx:53` — `<html className="font-sans ...">` mengikat seluruh app ke `--font-sans` = Hanken.

**Konsekuensi:** Geist di-load tapi **tidak pernah dipakai** untuk teks utama. Ini dead weight (2 file font ~134KB di-bundle tanpa efek visual). Aturan "Geist Sans untuk teks utama" tidak terpenuhi.

**Status:** 🔴 PELANGGARAN

---

### T-2 — `--font-mono` tidak didefinisikan di `@theme` (PELANGGARAN ATURAN MUTLAK)

**Fakta:**
- `globals.css` `@theme` block hanya mendefinisikan: `--font-sans`, `--font-syne`, `--font-hanken`.
- **Tidak ada** `--font-mono` maupun `--font-geist-mono` di `@theme`.
- Tailwind v4 generate utility `font-mono` dari `--font-mono`; absen token → `font-mono` jatuh ke default browser (`ui-monospace, monospace`), **bukan Geist Mono**.
- 11 komponen memakai `font-mono`:
  - `components/client/create-client-dialog.tsx` (email/password credentials)
  - `components/forms/fields/color-field.tsx` (hex value)
  - `components/library/library-client.tsx`
  - `components/settings/settings-view.tsx` (2 instance: code block + API key field)
  - `components/spectrumui/kbd-key.tsx` (keyboard shortcut)
  - `app/admin/erp/erp-client.tsx:171` (channel count `0 / 10`)
  - `app/admin/error.tsx:41` (error digest code)
  - `app/waitlist/page.tsx` (email + user ID)

**Konsekuensi:** "angka mutlak" dan "kode" yang harusnya Geist Mono jadi pakai font monospace generic browser. Inkonsisten lintas platform.

**Status:** 🔴 PELANGGARAN

---

### T-3 — Font display Syne hanya dipakai di login stage (konsistensi)

**Fakta:**
- `globals.css:44` — `--font-syne: var(--font-syne-src), ...`
- `globals.css:90` — `--font-display: var(--font-syne-src), ...`
- Pemakaian `font-display`/`font-syne` di komponen app: **perlu verifikasi** (scan awal tidak menemukannya di `components/`).

**Status:** 🟡 PERLU VERIFIKASI

---

## Bukti File

| File | Baris | Isi |
|---|---|---|
| `app/layout.tsx` | 31-40 | Geist di-load, variable `--font-geist-sans` / `--font-geist-mono` |
| `app/layout.tsx` | 53-54 | `<html className="font-sans">` + variable dilekatkan ke `<body>` |
| `globals.css` | 43 | `--font-sans: var(--font-hanken-src)...` (bukan Geist) |
| `globals.css` | 44-45 | `--font-syne`, `--font-hanken` didefinisikan |
| `globals.css` | @theme | **tidak ada** `--font-mono` |
| `app/fonts/` | — | `GeistVF.woff` (66KB), `GeistMonoVF.woff` (68KB), `HankenGroteskVF.woff2`, `SyneVF.woff2` |

---

## Rekomendasi Perbaikan

**T-1 fix:** Ganti `--font-sans` di `globals.css:43` ke Geist:
```css
--font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
```

**T-2 fix:** Tambah token mono di `@theme`:
```css
--font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
```

**T-3:** Verifikasi `font-display` dipakai konsisten untuk heading.

**Catatan keputusan (perlu konfirmasi pemilik produk):**
Aturan `design.md` §2 mengatakan Geist wajib untuk teks utama. Tapi komentar `globals.css` menulis *"Login-stage typefaces: Syne (display), Hanken Grotesk (body copy)"* — yang artinya ada **konflik antara `design.md` dan implementasi**. Perlu keputusan:
- **(A)** Ikut `design.md` → Geist Sans untuk body, Geist Mono untuk angka/kode. (Syne/Hanken tetap untuk login stage.)
- **(B)** Update `design.md` → Hanken Grotesk jadi body font resmi, hapus aturan Geist.

**STATUS UPDATE (2026-10-11):**
Pemilik produk memilih opsi (B) — Hanken Grotesk jadi body font resmi.
Perbaikan yang sudah diterapkan:
- ✅ `design.md` §2 di-update: "Tipografi: Hanken Grotesk (body), Syne (display/login), Geist Mono (angka/kode)"
- ✅ `globals.css` @theme: ditambahkan `--font-mono: var(--font-geist-mono)`
- ✅ `npx tsc --noEmit`: clean
- ✅ `npx vitest run`: 180/180 test pass
- ✅ Font token ter-compile: Tailwind generate `.font-mono` ke `var(--font-mono)` (verified di compiled CSS line 4982)


---

## Status
- [x] 1.2 — Audit tipografi (SELESAI — design.md + globals.css sudah di-update, TSC clean, 180 test pass)
