## Purpose

Menyediakan sistem notifikasi real-time dan interaktif berbasis Telegram Bot untuk admin dan klien Frhm, mencakup penautan akun via deep link, notifikasi review konten, feedback revisi, dan status jadwal publikasi.

## ADDED Requirements

### Requirement: Telegram Account Linking via Deep Link
Sistem SHALL menyediakan alur penautan akun Telegram secara aman dan instan menggunakan deep link bot tanpa meminta nomor telepon pengguna.

#### Scenario: Klien menautkan akun Telegram pertama kali
- **WHEN** klien mengklik tombol "Hubungkan Telegram" pada portal klien dan menekan tombol "Start" pada aplikasi Telegram
- **THEN** webhook sistem SHALL memvalidasi token sesi dan menyimpan ID chat Telegram klien ke basis data serta mengonfirmasi penautan sukses melalui pesan bot

#### Scenario: Admin menautkan akun Telegram untuk peringatan sistem
- **WHEN** admin membuka menu pengaturan notifikasi dan memulai proses integrasi Telegram
- **THEN** sistem SHALL mengasosiasikan ID chat Telegram admin dengan akun admin aktif dan menampilkan status terhubung

### Requirement: Content Review Notification for Clients
Sistem SHALL mengirimkan pesan notifikasi Telegram otomatis kepada klien ketika status konten berubah menjadi status siap review.

#### Scenario: Pengiriman notifikasi draft konten baru
- **WHEN** tim Frhm mengubah status deliverable konten menjadi "Review" untuk brand klien terkait
- **THEN** sistem SHALL mengirimkan pesan Telegram ke chat ID klien berisi judul konten, platform, jadwal tayang yang direncanakan, dan tautan langsung untuk meninjau di portal web

#### Scenario: Klien belum menautkan Telegram
- **WHEN** status konten berubah menjadi "Review" tetapi klien belum menghubungkan akun Telegram
- **THEN** sistem SHALL mencatat status pengiriman sebagai dilewati tanpa menimbulkan error pada alur perubahan status konten

### Requirement: Client Feedback and Approval Alert for Admin
Sistem SHALL mengirimkan peringatan instan ke Telegram admin saat klien memberikan tanggapan berupa persetujuan atau catatan revisi.

#### Scenario: Klien menyetujui konten
- **WHEN** klien menekan tombol setujui konten pada portal klien
- **THEN** sistem SHALL mengirimkan pesan ke Telegram admin yang menyatakan konten telah disetujui beserta nama brand dan judul konten

#### Scenario: Klien meminta revisi
- **WHEN** klien mengirimkan formulir revisi dengan catatan perbaikan
- **THEN** sistem SHALL mengirimkan notifikasi prioritas ke Telegram admin yang mencantumkan poin-poin revisi dari klien

### Requirement: Scheduled Content Publishing Status Alert
Sistem SHALL memberikan laporan singkat ke Telegram mengenai keberhasilan atau kendala pada proses penerbitan konten terjadwal.

#### Scenario: Publikasi konten berhasil
- **WHEN** cron job penerbitan konten berhasil mempublikasikan konten ke akun media sosial
- **THEN** sistem SHALL mengirimkan notifikasi konfirmasi publikasi ke Telegram admin

#### Scenario: Terjadi kendala saat publikasi otomatis
- **WHEN** cron job menemui kegagalan koneksi API atau token kadaluarsa saat mencoba mempublikasikan konten
- **THEN** sistem SHALL mengirimkan pesan peringatan darurat ke Telegram admin dengan deskripsi kendala yang terjadi
