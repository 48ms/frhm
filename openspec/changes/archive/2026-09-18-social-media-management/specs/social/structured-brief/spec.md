# Spec Delta

## Purpose
Menstandarisasi proses pembuatan *brief* kreatif (*copywriting* dan visual) menggunakan templat formula *hook* yang tervalidasi agar hasil produksi akurat.

## ADDED Requirements

### Requirement: Formulir Terstruktur
Sistem SHALL membagi *input* teks konten menjadi bagian-bagian terstruktur: "Visual Hook", "Body/Value", dan "Call to Action", menggantikan kotak teks tunggal.

#### Scenario: Pengisian brief Reels
- **WHEN** pengguna memilih format Reels
- **THEN** formulir mewajibkan pengisian di kotak "Visual Hook (0-3 detik)" sebelum mengizinkan pengisian "Body"

### Requirement: Validasi Aturan Platform
Sistem SHALL memvalidasi *input* berdasarkan *best practice* spesifik platform, misalnya mencegah tautan luar (*external links*) di badan utama untuk platform tertentu.

#### Scenario: Peringatan link di LinkedIn
- **WHEN** pengguna memasukkan URL `https://...` di kolom "Body" untuk draf LinkedIn
- **THEN** sistem memunculkan peringatan bahwa tautan di LinkedIn menurunkan *reach* dan menyarankan tautan ditaruh di kolom komentar
