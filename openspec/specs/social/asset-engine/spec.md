# Asset Engine

## Purpose
Mengotomatisasi penciptaan tugas turunan lintas platform (Repurposing) dari satu aset utama (Hero Asset) untuk menghemat waktu produksi.

## Requirements

### Requirement: Pembuatan Child Asset (Repurpose)
Sistem SHALL memiliki mekanisme untuk menghasilkan tugas/draf turunan (*child posts*) dari satu aset konten utama (*parent/hero asset*) berdasarkan *platform* yang dipilih pengguna.

#### Scenario: Repurpose video menjadi konten lintas platform
- **WHEN** pengguna mengeklik tombol "Repurpose" pada aset berformat video
- **THEN** sistem membuat draf terpisah untuk Reels, TikTok, dan versi teks untuk LinkedIn, yang semuanya tertaut pada ID aset video utama

### Requirement: Keterhubungan Aset Mentah
Semua *child posts* yang dihasilkan SHALL terhubung ke folder penyimpanan atau URL aset mentah yang sama dari *parent asset* mereka.

#### Scenario: Mengakses file mentah dari draf TikTok
- **WHEN** editor membuka draf *child task* untuk TikTok
- **THEN** editor dapat langsung mengunduh/melihat video mentah yang disematkan pada *parent task*-nya tanpa meminta ulang akses file
