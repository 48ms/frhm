# Sistem Scheduled Publish (#9)

Arsitektur untuk mempublikasikan post secara otomatis berdasarkan jadwal di tabel `scheduled_posts`.

## 1. Komponen Utama
- **Database (`scheduled_posts`)**: Source of truth. Kolom `status` ('scheduled', 'published', 'failed') dan `scheduled_at`.
- **Executor Endpoint (`/api/cron/publish`)**: Endpoint REST API Next.js.
  - Membaca semua post berstatus `scheduled` yang `scheduled_at <= NOW()`.
  - Berkomunikasi ke **WoopSocial Bridge** untuk mempublikasikan post tersebut *saat itu juga* (`PUBLISH_NOW`).
  - Mencatat hasilnya kembali ke tabel `scheduled_posts` (berubah jadi `published` atau `failed`) dan `audit_log`.

## 2. Keamanan (Security)
- Endpoint menggunakan `CRON_SECRET` melalui header `Authorization: Bearer <token>`.
- Hal ini mencegah orang iseng mengakses URL `/api/cron/publish` dan memaksa publish data diluar kendali.

## 3. Cara Menjalankan

Karena Next.js bersifat serverless (tidak punya daemon cron OS), endpoint ini harus di-*trigger* oleh service eksternal.

### Pilihan A: Supabase `pg_cron` (Standard SaaS)
Fitur bawaan PostgreSQL di Supabase. Anda bisa membuat job `pg_cron` yang menembak endpoint kita setiap menit via extension `pg_net`.
(Catatan: `pg_net` tidak bisa menembak `localhost`. Cara ini dipakai saat Frhm sudah di-deploy ke Vercel/VPS).

### Pilihan B: Vercel Cron
Jika Frhm di-deploy ke Vercel, cukup tambahkan `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/publish",
    "schedule": "* * * * *"
  }]
}
```

### Pilihan C: Script Lokal (Untuk Development)
Selama masih menggunakan `localhost`, kamu bisa menjalankan polling lokal.
1. Pastikan server dev jalan.
2. Hit endpoint dengan curl:
   ```bash
   curl -X POST http://localhost:3001/api/cron/publish \
        -H "Authorization: Bearer CRON_SECRET_BIMA_2026"
   ```