## Purpose

Menyediakan sistem intelijen tren harian dan mesin eksekusi konten otomatis yang memvalidasi kelayakan tren lewat The Three Gates serta menghasilkan 3 variasi hook teruji untuk materi promosi klien.

## Requirements

### Requirement: Daily Trend Radar Discovery
Sistem SHALL menyediakan kemampuan memindai tren pencarian dan percakapan media sosial terkini di wilayah Indonesia secara otomatis tanpa biaya langganan berbayar.

#### Scenario: Memuat radar tren harian Indonesia
- **WHEN** admin membuka tab radar tren pada workspace brand klien
- **THEN** sistem SHALL menampilkan daftar topik tren terhangat dari Google Trends Indonesia dan kategori F&B beserta skor relevansi awal

#### Scenario: Penyaringan kategori industri
- **WHEN** admin memilih filter kategori industri kuliner atau kopi
- **THEN** sistem SHALL memfilter daftar tren yang berkaitan dengan makanan, minuman, dan kebiasaan nongkrong konsumen lokal

### Requirement: Rapid Trend-Jacking Input
Sistem SHALL menyediakan sarana input cepat bagi pengguna untuk menempelkan tautan atau judul tren dari FYP media sosial guna langsung direkayasa ulang.

#### Scenario: Pengguna memasukkan tren manual dari FYP
- **WHEN** admin menempelkan judul atau deskripsi tren dari TikTok ke kolom input Trend-Jack instan
- **THEN** sistem SHALL menerima input tersebut dan memulai proses validasi The Three Gates terhadap brand profile klien yang dipilih

### Requirement: The Three Gates Evaluation
Sistem SHALL mengevaluasi setiap ide tren berdasarkan 3 parameter kelayakan (Fit, Safety, dan Timing) sebelum diizinkan masuk ke tahap produksi materi.

#### Scenario: Tren memenuhi syarat kelayakan
- **WHEN** topik tren memiliki skor Fit di atas 70 dan lolos pemeriksaan keamanan reputasi tanpa isu sensitif
- **THEN** sistem SHALL menandai tren sebagai "Disetujui untuk Produksi" dan menampilkan rincian nilai The Three Gates

#### Scenario: Tren tidak aman atau tidak relevan
- **WHEN** topik tren terdeteksi memuat kontroversi atau tidak memiliki korelasi yang masuk akal dengan produk klien
- **THEN** sistem SHALL menolak tren tersebut dengan label peringatan dan memberikan penjelasan alasan penolakan

### Requirement: Multi-Hook Variant Generation
Sistem SHALL memproduksi tiga variasi kalimat pembuka (hook) berorientasi psikologis yang berbeda untuk setiap materi konten yang dihasilkan.

#### Scenario: Menghasilkan 3 variasi hook pada draft deliverable
- **WHEN** proses penulisan konten selesai dieksekusi oleh mesin tren
- **THEN** sistem SHALL menyajikan opsi Hook Contrarian, Hook Storytelling, dan Hook Direct Value pada kartu deliverable

### Requirement: Auto Deliverable Creation with Telegram Notification
Sistem SHALL secara otomatis menyimpan hasil generasi konten tren ke tabel deliverable dan mengirimkan tautan peninjauan instan ke bot Telegram.

#### Scenario: Konten tren siap direview
- **WHEN** materi konten selesai diproduksi lengkap dengan 3 variasi hook
- **THEN** sistem SHALL membuat deliverable baru berstatus "sent" dan mengirimkan notifikasi instan ke chat Telegram bot Frhm
