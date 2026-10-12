# Laporan Audit Sub-item 1.4 — Placeholder vs Label

> Aturan mutlak (`design.md` §5): *"Dilarang keras menggunakan placeholder sebagai pengganti label. Setiap input wajib memiliki `<Label>` eksplisit yang selalu tampil."*
> Tanggal: 2026-10-11

---

## Temuan
Banyak form mengabaikan `<Label>` dan hanya mengandalkan `placeholder` (buruk untuk aksesibilitas & UX).

**Contoh pelanggaran:**
- `post-dialog.tsx`: Caption, Campaign, Priority fields hanya placeholder.
- `brand-profile-tab.tsx`: Deskripsi brand hanya placeholder.
- `create-client-dialog.tsx`: Email, Phone, Niche hanya placeholder.

---

## Status
- [x] 1.4 — Audit (SELESAI)
- [ ] 1.4.1 — Refactor `post-dialog.tsx`
- [ ] 1.4.2 — Refactor `brand-profile-tab.tsx`
- [ ] 1.4.3 — Refactor `create-client-dialog.tsx`
