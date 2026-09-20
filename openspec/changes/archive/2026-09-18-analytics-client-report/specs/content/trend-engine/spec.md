# Spec Delta

## MODIFIED Requirements

### Requirement: Auto Deliverable Creation with Telegram Notification
Sistem SHALL secara otomatis menyimpan hasil generasi konten tren ke tabel deliverable, **menyertakan `campaign_tag` default dari sumber tren (radar: kategori F&B; trend-jack: manual input)**, dan mengirimkan tautan peninjauan instan ke bot Telegram.

#### Scenario: Konten tren siap direview dengan campaign context
- **WHEN** materi konten selesai diproduksi lengkap dengan 3 variasi hook
- **THEN** sistem SHALL membuat deliverable baru berstatus "sent" **dengan `campaign_tag` terisi dari sumber tren** dan mengirimkan notifikasi instan ke chat Telegram bot Frhm **yang menyertakan campaign tag dalam pesan**

#### Scenario: Trend-Jacking input manual campaign tag
- **WHEN** admin menempelkan judul tren dari FYP dan memilih campaign tag dari dropdown (atau membuat baru)
- **THEN** deliverable yang dihasilkan SHALL membawa `campaign_tag` yang dipilih admin