# Laporan Audit Sub-item 2.1 — Hardcoded Hex

> Aturan mutlak (`design.md` §2): *"Dilarang keras menggunakan hardcoded hex (#xxxxxx). Gunakan CSS Variable yang terdaftar di globals.css atau admin-stage.css."*
> Tanggal: 2026-10-11
> Target: Migrasi seluruh hex ke sistem variabel.

---

## Rencana Migrasi (Sub-item 2.1)
1. **Pindahkan platform colors** (`composer-client.tsx`, `calendar-client.tsx`) ke CSS variable.
2. **Standardisasi PDF export** (`calendar-export-pdf.tsx`, `report-pdf.tsx`) untuk menggunakan referensi token (jika mungkin).
3. **Pindahkan Brand Logo** (`brand-logo.tsx`) ke aset SVG atau token.

## Status
- [ ] 2.1.1 — Migrasi platform colors (Instagram, TikTok, dll) ke `globals.css`
- [ ] 2.1.2 — Migrasi brand logo colors ke variabel
- [ ] 2.1.3 — Migrasi PDF colors ke referensi token
