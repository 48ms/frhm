# Content Planning

## Purpose
Mengatur pengelompokan dan distribusi strategi konten melalui sistem *Content Pillars* dan *Funnel Stages* agar seimbang dan selaras dengan *brand goals*.

## Requirements

### Requirement: Wajib pilih Pillar dan Funnel
Sistem SHALL memaksa pengguna untuk memilih *Content Pillar* (misalnya: Edukasi, Promo) dan *Funnel Stage* (Awareness, Consideration, Conversion) setiap kali membuat ide konten baru.

#### Scenario: Pembuatan ide baru gagal tanpa pillar
- **WHEN** pengguna mencoba menyimpan ide konten tanpa memilih pilar
- **THEN** sistem menolak penyimpanan dan menampilkan *error* validasi

### Requirement: Alokasi Pillar Kampanye
Sistem SHALL menyediakan kemampuan untuk membatasi atau menargetkan alokasi pilar dalam suatu rentang waktu (misalnya maksimal 20% konten Promo per bulan).

#### Scenario: Peringatan batas pilar
- **WHEN** pengguna menambahkan konten Promo yang melebihi batas alokasi bulanan
- **THEN** sistem memberikan peringatan (*warning*) sebelum konten disimpan
