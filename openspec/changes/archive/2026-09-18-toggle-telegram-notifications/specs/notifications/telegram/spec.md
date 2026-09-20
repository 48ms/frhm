## MODIFIED Requirements

### Requirement: Notification Preference Management

Sistem SHALL menyediakan kontrol preferensi notifikasi bagi pengguna (klien dan admin) untuk mengaktifkan atau menonaktifkan pengiriman notifikasi Telegram tanpa memutuskan tautan akun (chat ID).

#### Scenario: Pengguna menonaktifkan notifikasi sementara
- **WHEN** pengguna menekan tombol "Jeda Notifikasi" pada kartu koneksi Telegram
- **THEN** sistem SHALL memperbarui kolom `telegram_notifications_enabled` menjadi `false` di basis data, mempertahankan `telegram_chat_id` dan `telegram_username` yang sudah tersimpan

#### Scenario: Pengguna mengaktifkan kembali notifikasi
- **WHEN** pengguna menekan tombol "Aktifkan Notifikasi" pada kartu koneksi Telegram
- **THEN** sistem SHALL memperbarui kolom `telegram_notifications_enabled` menjadi `true` di basis data

### Requirement: Three-State Connection Status Visualization

Sistem SHALL menampilkan status koneksi Telegram dalam tiga kondisi visual yang dibedakan oleh warna dan label, bukan hanya dua kondisi.

#### Scenario: Koneksi aktif dan notifikasi diaktifkan
- **WHEN** `telegram_chat_id` terisi DAN `telegram_notifications_enabled = true`
- **THEN** kartu SHALL menampilkan badge "Terhubung" dengan warna hijau dan ikon centang

#### Scenario: Koneksi ada tapi notifikasi dinonaktifkan
- **WHEN** `telegram_chat_id` terisi DAN `telegram_notifications_enabled = false`
- **THEN** kartu SHALL menampilkan badge "Dijeda" dengan warna kuning/oranye dan ikon lonceng bersilang (BellOff)

#### Scenario: Belum terhubung
- **WHEN** `telegram_chat_id` kosong
- **THEN** kartu SHALL menampilkan badge "Belum Terhubung" dengan warna netral

### Requirement: Automatic Deactivation on Bot Block

Sistem SHALL menonaktifkan notifikasi secara otomatis ketika mendeteksi bahwa bot Telegram diblokir oleh pengguna.

#### Scenario: Bot diblokir oleh pengguna
- **WHEN** pengiriman notifikasi Telegram mengembalikan respons HTTP 403 (*Forbidden: bot was blocked by the user*)
- **THEN** sistem SHALL menandai `telegram_notifications_enabled = false` pada record pengguna/klien terkait
- **AND** kartu koneksi Telegram pada portal SHALL otomatis berubah menampilkan status "Dijeda" dengan warna peringatan