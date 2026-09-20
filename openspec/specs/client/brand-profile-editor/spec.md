# client/brand-profile-editor Specification

## Purpose
TBD - created by archiving change brand-profile-editor. Update Purpose after archive.

## Requirements

### Requirement: Inline Brand Profile Editor
Sistem MUST menyediakan dialog editor interaktif untuk file `brand-profile.md` di halaman workspace client tab Foundation.

#### Scenario: Admin membuka editor brand profile
- **GIVEN** admin berada di halaman `/admin/clients/[id]` pada tab Foundation
- **WHEN** admin klik tombol "Edit Brand Profile"
- **THEN** sistem MUST membuka dialog editor dengan form yang terisi data parsing dari `brand-profile.md` saat ini

#### Scenario: Admin menyesuaikan alokasi persentase pilar konten
- **GIVEN** editor terbuka dengan 4 pilar konten
- **WHEN** admin mengubah slider/input persentase salah satu pilar
- **THEN** sistem MUST menghitung total persentase real-time dan menampilkan indikator visual (valid jika 100%, peringatan jika != 100%)

#### Scenario: Admin menyimpan perubahan
- **GIVEN** editor terbuka dengan total alokasi 100%
- **WHEN** admin klik tombol "Simpan Perubahan"
- **THEN** sistem MUST menyusun ulang format markdown `brand-profile.md` dan menyimpan ke database via API `client_files`
- **AND** dialog MUST tertutup, konten workspace ter-refresh otomatis tanpa reload halaman penuh

#### Scenario: Admin membatalkan edit
- **GIVEN** editor terbuka dan admin telah mengubah input
- **WHEN** admin klik "Batal" atau menutup modal
- **THEN** sistem MUST membatalkan perubahan dan data kembali ke versi sebelumnya
