## 1. Database & Environment Setup

- [x] 1.1 Siapkan migrasi SQL untuk menambahkan kolom `telegram_chat_id`, `telegram_username`, dan `telegram_notifications_enabled` pada tabel `clients` dan `users`, lalu verifikasi skema pada Supabase database types.
- [x] 1.2 Konfigurasi environment variables `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_SECRET_TOKEN`, dan `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` pada `.env.local.example` dan dokumentasi terkait.

## 2. Core Telegram Service & Webhook

- [x] 2.1 Buat modul utilitas `lib/telegram/service.ts` untuk fungsi pengiriman pesan (`sendTelegramMessage`), keyboard interaktif, dan format MarkdownV2/HTML dengan penanganan error yang aman.
- [x] 2.2 Buat route handler `app/api/telegram/webhook/route.ts` untuk menangkap update dari Telegram Bot, memvalidasi secret token, dan mengekstrak perintah `/start <token>` guna menautkan Chat ID ke database.
- [x] 2.3 Buat route handler pengujian `app/api/telegram/test/route.ts` yang memungkinkan admin menguji pengiriman pesan uji coba ke Chat ID tertentu.

## 3. UI Components & Integration

- [x] 3.1 Buat komponen UI `components/telegram/telegram-connect-card.tsx` yang menampilkan status penautan Telegram (Belum Terhubung / Terhubung) dengan tombol deep link ke bot dan verifikasi render di portal klien.
- [x] 3.2 Integrasikan `telegram-connect-card` ke dalam Portal Klien pada tab Dashboard atau Deliverables (`app/app/client/deliverables/page-client.tsx`).
- [x] 3.3 Tambahkan seksi pengaturan Telegram pada Dashboard Admin (`app/app/admin/settings` atau komponen overview) agar admin dapat menerima notifikasi operasional.

## 4. Event Triggers & Business Logic Wiring

- [x] 4.1 Sambungkan trigger notifikasi Telegram pada alur saat deliverable diubah statusnya menjadi `sent` (Review) agar klien menerima pesan notifikasi instan.
- [x] 4.2 Sambungkan trigger notifikasi Telegram pada dialog feedback klien (`components/client/feedback-dialog.tsx`) saat klien menyetujui konten (`approved`) atau meminta revisi (`revision_requested`) agar admin menerima notifikasi langsung.
- [x] 4.3 Tambahkan notifikasi pengingat publikasi terjadwal pada cron/job handler konten jika ada kegagalan publikasi.

## 5. Verification & Type Checking

- [x] 5.1 Jalankan `npx tsc --noEmit` untuk memastikan tidak ada kesalahan tipe TypeScript di seluruh codebase.
- [x] 5.2 Lakukan verifikasi visual dan aksesibilitas (WCAG AA, target tap 44px, anti-slop rules) pada komponen UI yang baru ditambahkan.
