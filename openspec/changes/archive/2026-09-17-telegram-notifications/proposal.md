## Why

Frhm saat ini belum memiliki saluran notifikasi proaktif real-time ke admin maupun klien (seperti Pak Adit untuk Taraju dan Bunda untuk Pawon Sengon). Komunikasi proses persetujuan (approval), permintaan revisi, dan status penerbitan konten masih bergantung pada pengecekan dashboard secara manual.

Mengintegrasikan Telegram Bot API menyediakan saluran notifikasi gratis tanpa batas kuota (tanpa biaya per percakapan seperti WhatsApp API), dengan latensi instan, tautan langsung ke portal review, dan kemudahan onboarding klien cukup dengan sekali klik tombol deep link.

## What Changes

- **Integrasi Telegram Bot Service**: Menambahkan service utility untuk mengirimkan pesan berformat Markdown/HTML dan inline action buttons via Telegram Bot API.
- **Webhook Endpoint**: Membuat API route `/api/telegram/webhook` untuk menangani command bot, terutama `/start <token>` guna mengaitkan akun admin atau klien secara otomatis.
- **Database Schema**: Menambahkan kolom identifikasi Telegram (`telegram_chat_id`, `telegram_username`, `telegram_notifications_enabled`) pada entitas klien dan profil admin.
- **UI Onboarding Telegram**:
  - Tombol dan dialog "Hubungkan Telegram" pada Portal Klien (`app/app/client/`) dengan status koneksi real-time.
  - Opsi pengaturan notifikasi Telegram pada Dashboard Admin (`app/app/admin/settings`).
- **Trigger Event Notifikasi Otomatis**:
  - **Konten Siap Direview**: Klien menerima notifikasi Telegram saat status konten berubah menjadi `Review`, dilengkapi tombol deep link ke halaman review.
  - **Feedback / Approval Masuk**: Admin menerima notifikasi Telegram saat klien menyetujui konten atau mengirimkan catatan revisi.
  - **Publikasi Selesai / Gagal**: Notifikasi hasil publikasi otomatis ke admin dan klien terkait.

## Capabilities

### New Capabilities
- `notifications/telegram`: Manajemen koneksi bot Telegram, penerimaan webhook deep link, dan pengiriman notifikasi event-driven (review request, client approval/revision feedback, schedule alert) untuk admin dan klien Frhm.

### Modified Capabilities
*(None)*

## Impact

- **Database**: Memerlukan migrasi ringan pada tabel Supabase (kolom `telegram_chat_id`, `telegram_username`, `telegram_notifications_enabled` pada tabel klien/pengguna, serta tabel log notifikasi opsional).
- **Environment Variables**: Membutuhkan `TELEGRAM_BOT_TOKEN` dan `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
- **API Routes**: Penambahan endpoint baru `app/api/telegram/webhook/route.ts` dan route pengujian `app/api/telegram/test/route.ts`.
- **UI Components**: Penambahan komponen status & tombol koneksi Telegram di Portal Klien dan Admin Settings.
- **Dependencies**: Menggunakan native fetch ke `api.telegram.org` tanpa perlu library eksternal tambahan.
