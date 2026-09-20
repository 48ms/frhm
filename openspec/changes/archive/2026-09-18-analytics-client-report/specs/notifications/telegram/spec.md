# Spec Delta

## MODIFIED Requirements

### Requirement: Scheduled Content Publishing Status Alert
Sistem SHALL memberikan laporan singkat ke Telegram mengenai keberhasilan atau kendala pada proses penerbitan konten terjadwal, **termasuk konteks metrik nol saat publish gagal agar operator tahu slot hangus & metrik kosong**.

#### Scenario: Publikasi konten berhasil
- **WHEN** cron job penerbitan konten berhasil mempublikasikan konten ke akun media sosial
- **THEN** sistem SHALL mengirimkan notifikasi konfirmasi publikasi ke Telegram admin **berisi: judul, platform, external_post_id, campaign_tag (jika ada), dan waktu publikasi**

#### Scenario: Terjadi kendala saat publikasi otomatis
- **WHEN** cron job menemui kegagalan koneksi API atau token kadaluarsa saat mencoba mempublikasikan konten
- **THEN** sistem SHALL mengirimkan pesan peringatan darurat ke Telegram admin dengan: **deskripsi kendala, judul konten, platform, campaign_tag (jika ada), scheduled_at, dan catatan "Metrik akan 0 untuk slot ini — butuh keputusan manual (tunda/posting ulang)"**

#### Scenario: Publish berhasil tapi metrik nol setelah 24 jam (escalation)
- **WHEN** konten terpublish tapi `post_metrics` masih kosong 24 jam setelah `published_at`
- **THEN** sistem SHALL mengirimkan reminder ke Telegram admin: "Post [judul] tayang 24 jam lalu tapi metrik 0 — cek native analytics & input manual"