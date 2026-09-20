## Why

Meskipun backend notifikasi Telegram telah memiliki kolom `telegram_notifications_enabled` dan logika mitigasi error 403 (*Forbidden: bot was blocked by the user*), antarmuka `TelegramConnectCard` saat ini belum memanfaatkan nilai tersebut. Akibatnya:
1. Kartu tetap menampilkan status "Terhubung" berwarna hijau meskipun notifikasi dinonaktifkan atau bot diblokir, sehingga pengguna tidak menyadari bahwa notifikasi gagal terkirim.
2. Pengguna (klien maupun admin) tidak memiliki kontrol manual untuk menjeda sementara (*mute*) notifikasi tanpa harus memutuskan koneksi (*disconnect*) dan menghapus data chat ID.
3. Kode frontend menyisakan variabel dan ikon yang belum digunakan (`enabled`, `setEnabled`, `BellIcon`, `BellOffIcon`), memicu kesalahan linting dan menandakan fitur yang belum tuntas.

## What Changes

- **Kontrol Preferensi Notifikasi (Toggle On/Off)**: Menambahkan tombol aksi toggle (Jeda / Aktifkan) pada `TelegramConnectCard` untuk mengubah status aktif notifikasi tanpa menghapus chat ID.
- **Dukungan Tiga Status Visual**:
  - `Terhubung` (hijau): Chat ID ada dan notifikasi aktif.
  - `Dijeda` (kuning/oranye): Chat ID ada tetapi notifikasi dinonaktifkan secara manual atau otomatis akibat blokir bot.
  - `Belum Terhubung` (netral): Chat ID belum ditautkan.
- **Endpoint Preferensi Baru**: Menyediakan route `PATCH /api/telegram/preferences` untuk memperbarui kolom `telegram_notifications_enabled` secara aman bagi klien atau admin.
- **Penanganan Otomatis Error 403**: Pada modul `lib/telegram/service.ts`, saat Telegram API mengembalikan kode status 403 (bot diblokir), sistem otomatis menandai `telegram_notifications_enabled = false` pada basis data agar status di portal berubah menjadi "Dijeda".
- **Migrasi Skema Formal**: Menyediakan file migrasi SQL formal untuk memastikan kolom Telegram (`telegram_chat_id`, `telegram_username`, `telegram_notifications_enabled`) terdefinisi di repository migrasi proyek.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `notifications/telegram`: Menambahkan kebutuhan penanganan status preferensi notifikasi (manual mute/unmute), visualisasi status koneksi 3-state, dan de-aktivasi otomatis saat bot diblokir.

## Impact

- **API Routes**: Penambahan endpoint baru `app/api/telegram/preferences/route.ts` (metode `PATCH`).
- **Core Services**: Penambahan logika update database otomatis pada `lib/telegram/service.ts` saat mendeteksi error HTTP 403.
- **UI Components**: Pembaruan komponen `components/telegram/telegram-connect-card.tsx` untuk menampilkan badge 3-state dan tombol toggle notifikasi menggunakan `BellIcon` dan `BellOffIcon`.
- **Database Migrations**: Penambahan file migrasi `supabase/migrations/027_telegram_integration_columns.sql` yang mendokumentasikan kolom Telegram secara idempotent (`ADD COLUMN IF NOT EXISTS`).
- **Lint Hygiene**: Menghilangkan 4 error ESLint terkait `no-unused-vars` di `telegram-connect-card.tsx` secara fungsional.
