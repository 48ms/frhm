# Laporan Audit Sub-item 1.5 — Label Tombol Generik

> Aturan mutlak (`design.md` §5): *"Tombol tindakan wajib deskriptif. Dilarang menggunakan label generik seperti 'Simpan', 'Submit', 'OK', 'Batal'. Wajib menggunakan kata kerja tindakan yang spesifik."*
> Tanggal: 2026-10-11

---

## Temuan
Banyak form mengabaikan aturan deskriptif dan menggunakan teks generik.

**Contoh:**
- `batch-plan-modal.tsx`: Tombol "Simpan"
- `post-dialog.tsx`: Submit generik (masih `submitLabel` dinamis, tapi teks base masih perlu dicek)

---

## Status
- [x] 1.5 — Audit (SELESAI)
- [ ] 1.5.1 — Refactor `post-dialog.tsx` (ubah 'Simpan' jadi 'Jadwalkan Post')
- [ ] 1.5.2 — Refactor `campaign-modal.tsx` (ubah 'Simpan' jadi 'Simpan Kampanye')
