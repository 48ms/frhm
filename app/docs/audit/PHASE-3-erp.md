# Laporan Audit Sub-item 3.4 — ERP Dashboard

> Target: `app/admin/erp/erp-client.tsx`, `app/admin/erp/page.tsx`
> Tanggal: 2026-10-11
> Metode: Analisis statis + verifikasi definisi class di CSS.

---

## Temuan Audit

### E-1 — `font-headline-xl` / `font-headline-md` adalah CLASS MATI (BUG)

**Fakta:**
- `erp-client.tsx:68` — `<h1 className="... font-headline-xl ...">`
- `erp-client.tsx:104` — `<span className="... font-headline-xl ...">`
- `erp-client.tsx:160` — `<h2 className="... font-headline-md ...">`
- **Verifikasi**: `grep -rn "\.font-headline-xl|\.font-headline-md" --include="*.css"` → **KOSONG**. Tidak ada definisi.
- Yang terdefinisi di `admin-stage.css:425,438` adalah `.admin-headline-xl` dan `.admin-headline-md`.

**Konsekuensi:** Heading ERP kehilangan font Syne (yang seharusnya di-set oleh `.admin-headline-*`). Class `font-headline-xl` diabaikan total oleh CSS.

**Status:** 🔴 BUG

### E-2 — Angka metrik besar pakai font display, bukan Geist Mono

**Fakta:**
- `erp-client.tsx:104` — angka `{totalDeliverable}` pakai `font-headline-xl` (seharusnya Syne/display).
- Aturan mutlak (hasil 1.2): angka/kode wajib **Geist Mono** (`font-mono`).

**Status:** 🔴 PELANGGARAN

### E-3 — Konsistensi positif
- `erp-client.tsx:171` — angka `{channels} / 10` **sudah** pakai `font-mono`. ✅
- Metrik dihitung dari data nyata (bukan teks statis). ✅
- Skeleton `loading.tsx`, `error.tsx` ada. ✅

---

## Rencana Perbaikan
1. Ganti `font-headline-xl` → `admin-headline-xl` (3 lokasi: baris 68, 104, 160).
2. Ganti `font-headline-md` → `admin-headline-md`.
3. Angka `totalDeliverable` (baris 104) → `font-mono`.

---

## Status
- [x] 3.4 — Audit ERP (SELESAI)
- [ ] 3.4.1 — Fix dead class `font-headline-*` → `admin-headline-*`
- [ ] 3.4.2 — Angka metrik → `font-mono`
