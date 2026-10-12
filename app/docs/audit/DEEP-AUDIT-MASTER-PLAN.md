# 🔬 DEEP AUDIT MASTER PLAN — Area UI Belum Tersentuh

> Tujuan: Menyisir sisa inkonsistensi UI, gap aksesibilitas, dead/hardcoded styles, dan masalah interaksi yang **belum** tercakup audit Fase 1–5.
> Metode: ECC (Plan → Execute → Verify). 1 sub-item tuntas + verifikasi (tsc + vitest) sebelum lanjut.
> Sumber kebenaran: `/design.md`

---

## FASE A — Komponen Tersembunyi & Modal Dialog
- [ ] **A.1** Sapu seluruh modal/dialog (`components/**/*.tsx`) untuk tombol generik ("Batal"/"Simpan"/"OK") → ganti verb deskriptif.
- [ ] **A.2** Audit konsistensi padding/radius/shadow Card & Dialog (standar `rounded-2xl|3xl`, `border-border/40`).
- [ ] **A.3** Audit konsistensi header dialog (judul + tombol tutup ber-`aria-label`).
- [ ] **A.4** Audit komponen yang jarang dipakai: `notification-center`, `workspace-switcher`, `admin-command-search`, `asset-picker`, `combobox-field`.

## FASE B — Tipografi & Skala Font Lanjutan
- [ ] **B.1** Sapu seluruh angka metrik/finansial → pastikan `font-mono` (Geist Mono), temukan sisa `font-syne`/default pada angka.
- [ ] **B.2** Pastikan headline utama → `admin-headline-*`/`font-display` (Syne); temukan sisa class mati.
- [ ] **B.3** Pastikan body copy → Hanken Grotesk; deteksi mixed-font tak sengaja.
- [ ] **B.4** Audit skala font (text-[10px]/[11px] ekstrem) & konsistensi line-height.

## FASE C — Interaktivitas, State & Hardcoded Color Sisa
- [ ] **C.1** Audit touch target < 44px pada kontrol kecil (`h-8`, `p-1`, `p-0.5`) → tambah padding/`min-h`.
- [ ] **C.2** Verifikasi `focus-visible:ring` pada SEMUA elemen interaktif (button, input, select, link).
- [ ] **C.3** Sapu sisa hardcoded hex/rgb/named-color (`blue-500`, `emerald-600`, `bg-white`) → token.
- [ ] **C.4** Audit state disabled & loading (opacity, cursor, spinner) konsisten.

## FASE D — Verifikasi Akhir
- [ ] **D.1** `npx tsc --noEmit` hijau.
- [ ] **D.2** `npx vitest run` hijau (180 test).
- [ ] **D.3** `next build` sukses (tanpa SSR/hydration error).

---

## Log Eksekusi
| Sub | Status | Catatan |
|-----|--------|---------|
| A.1 | ✅ SELESAI | `post-dialog`: Batal→Batalkan, Hapus→Hapus Postingan; `calendar-client`: Cancel→Batalkan, Publish Now→Publikasikan Sekarang. Test diperbarui, 180/180 pass. |
| A.3 | ✅ SELESAI | `campaign-detail-modal.tsx`: close 按钮加 `aria-label="关闭"`, 文案 `Close` → `关闭` |
| A.4 | ✅ SELESAI | `asset-picker`: Fix text size 9px → 10px (accessibility). |
| — | — | — |
