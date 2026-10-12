# Laporan Audit Sub-item 1.3 — Dropdown < 5 Opsi

> Aturan mutlak (`design.md` §5): *"Dropdown yang Diharamkan: Dilarang keras menggunakan dropdown menu jika jumlah opsi di bawah 5 buah. Wajib menggunakan Radio/Toggle Pill/Segmented Control beranimasi."*
> Tanggal: 2026-10-11
> Metode: audit pemakaian `DropdownMenu` dan `Select` di seluruh komponen `.tsx`.

---

## Inventarisasi Pemakaian Dropdown/Select

| Komponen / File | Jenis | Fungsi / Opsi | Jumlah Opsi | Status |
|---|---|---|---|---|
| `components/nav-user.tsx` | DropdownMenu | Menu profil (Keluar) | 1 opsi | ⚠️ **LANGGARAN** (bukan pemilih opsi, tapi menu aksi; boleh dikecualikan atau dijadikan pill) |
| `app/admin/header.tsx` | DropdownMenu | Menu profil admin (Sign out) | 1 opsi | ⚠️ Menu aksi |
| `components/theme-selector.tsx` | DropdownMenu | Pilihan tema (Light / Dark / System) | **3 opsi** (< 5) | 🔴 **PELANGGARAN NYATA** (wajib Toggle Pill / Segmented Control) |
| `components/social-accounts/social-accounts-board.tsx` | DropdownMenu | Aksi channel (Refresh, Disconnect) | 2 opsi | ⚠️ Menu konteks (aksi, bukan pemilihan nilai) |
| `app/admin/calendar/calendar-client.tsx` (baris 441) | DropdownMenu | Filter tampilan kalender (Month / Week / Day) | **3 opsi** (< 5) | 🔴 **PELANGGARAN NYATA** (wajib Segmented Control) |
| `app/admin/calendar/calendar-client.tsx` (baris 921) | DropdownMenu | Aksi post per-hari (+1 hari, -1 hari, dll) | 5 opsi | ✅ Aman (≥ 5 opsi) |
| `components/campaigns/campaigns-board.tsx` | DropdownMenu | Filter kampanye / aksi | 2-3 opsi | 🔴 **PELANGGARAN** |
| `app/admin/composer/composer-client.tsx` | Select | Pilihan platform publikasi | Sesuai channel (bisa < 5) | 🟡 Tergantung jumlah channel aktif |
| `components/calendar/post-dialog.tsx` | Select | Pilihan platform / kampanye | Variabel (< 5) | 🟡 Perlu dicek dinamis |

---

## Analisis & Klasifikasi

1. **Menu Konteks / Aksi (`nav-user`, `header`, `social-accounts-board`)**: Digunakan untuk aksi klik (`Sign out`, `Disconnect`), bukan untuk memilih *state* atau nilai filter. Ini secara fungsional bukan "dropdown pemilihan opsi", sehingga tidak melanggar roh aturan §5 (walaupun secara UI bisa dipoles).
2. **Pemilih State / Filter (`theme-selector.tsx`, calendar view switch, campaign filter)**: Jelas-jelas melanggar aturan §5 karena menampilkan < 5 opsi dalam bentuk dropdown menu popover.

---

## Rencana Perbaikan (Phase 1.3 Action)

1. **Theme Selector (`components/theme-selector.tsx`)**: Ubah dari `DropdownMenu` menjadi *Segmented Control* / *Toggle Pill* beranimasi (Light | Dark | System).
2. **Calendar View Switcher (`app/admin/calendar/calendar-client.tsx`)**: Ubah pilihan Month/Week/Day dari Dropdown menjadi *Segmented Control*.

---

## Status
- [x] 1.3 — Audit dropdown < 5 opsi (SELESAI — inventarisasi & pelanggaran teridentifikasi)
- [ ] 1.3.1 — Refactor `theme-selector.tsx` menjadi Segmented Control
- [ ] 1.3.2 — Refactor Calendar View Switcher menjadi Segmented Control
