## Context

Sistem Frhm dibangun dengan Next.js App Router, Supabase (PostgreSQL & Auth), dan antarmuka Spectrum UI / Tailwind CSS v4. Klien seperti Taraju (Pak Adit) dan Pawon Sengon (Bunda) berinteraksi melalui portal klien (`/client/*`), sedangkan Bima mengelola operasional melalui portal admin (`/admin/*`).

Komunikasi persetujuan materi konten dan feedback saat ini masih pasif (menunggu login ke portal). Notifikasi Telegram Bot dipilih sebagai jalur utama karena bebas biaya langganan, memiliki API REST yang andal, dan mendukung interaksi tombol langsung (*inline keyboard*).

## Goals / Non-Goals

**Goals:**
- Menyediakan modul service Telegram (`lib/telegram/service.ts`) untuk mengirim notifikasi kaya (HTML/Markdown + inline button links).
- Membuat endpoint webhook `/api/telegram/webhook` yang menangani perintah `/start <token>` untuk menautkan akun klien atau admin secara otomatis tanpa input manual ID numerik chat.
- Menambahkan kolom `telegram_chat_id` dan `telegram_username` pada tabel `clients` dan `users`.
- Menambahkan komponen UI "Hubungkan Telegram" pada portal klien dan menu pengaturan admin.
- Mengirim notifikasi otomatis pada event:
  - Deliverable berubah status menjadi `sent` (Review).
  - Deliverable disetujui (`approved`) atau diminta revisi (`revision_requested`).
  - Laporan status publikasi terjadwal.

**Non-Goals:**
- Membuat antarmuka chat dua arah penuh (chatbot AI percakapan kompleks) di Telegram. Telegram difokuskan sebagai saluran notifikasi proaktif dan tombol aksi cepat.
- Mengirim file biner video berukuran besar (>50MB) secara langsung melalui bot (menggunakan link streaming portal).

## Decisions

1. **Direct Fetch Telegram Bot API vs External SDK**
   * *Keputusan:* Menggunakan native `fetch` langsung ke endpoint `https://api.telegram.org/bot<TOKEN>/...`.
   * *Alasan:* Menjaga bundle size tetap ringan, tanpa dependensi library pihak ketiga seperti Telegraf atau Node-telegram-bot-api yang sering mengalami isu kompatibilitas pada edge/serverless Next.js runtime.
   * *Alternatif yang dipertimbangkan:* GrammY / Telegraf (ditinggalkan untuk menghindari overhead dependensi).

2. **Mekanisme Deep Link Binding (`/start <token>`)**
   * *Keputusan:* Pengguna diarahkan ke `https://t.me/<BotUsername>?start=<auth_payload>`. Saat menekan "Start", Telegram mengirimkan update webhook ke Frhm dengan payload tersebut.
   * *Alasan:* Klien tidak perlu mencari tahu berapa Chat ID numerik mereka (menghilangkan friksi teknis bagi klien).
   * *Alternatif yang dipertimbangkan:* Meminta klien mengetikkan User ID Telegram secara manual (rawan salah ketik dan membingungkan klien).

3. **Penyimpanan Chat ID pada Skema Database**
   * *Keputusan:* Menambahkan kolom `telegram_chat_id` (text/bigint) dan `telegram_username` (text) pada tabel `clients` (untuk notifikasi representatif brand/grup) dan tabel `users` (untuk notifikasi personal admin).
   * *Alasan:* Memungkinkan notifikasi dikirimkan ke personal PIC klien maupun ke grup Telegram resmi brand jika bot diundang ke grup tim.

4. **Penanganan Kegagalan Pengiriman (Resilience & Non-blocking)**
   * *Keputusan:* Pengiriman notifikasi Telegram dijalankan secara asinkron (*non-blocking*). Jika pengiriman gagal (misalnya bot diblokir pengguna atau token bermasalah), status perubahan konten di portal tetap sukses dan error dicatat pada log tanpa mengganggu user flow.

## Risks / Trade-offs

- **[Risk]** Bot diblokir oleh klien atau chat dihapus.
  - *Mitigasi:* Tangani respons error 403 (*Forbidden: bot was blocked by the user*) dengan menandai status `telegram_notifications_enabled = false` dan menampilkan peringatan di portal agar klien dapat menghubungkan kembali jika diinginkan.
- **[Risk]** Webhook rahasia Telegram disalahgunakan oleh pihak tidak berwenang.
  - *Mitigasi:* Terapkan validasi `X-Telegram-Bot-Api-Secret-Token` pada route `/api/telegram/webhook`.
- **[Risk]** Rate limiting Telegram API jika ada pengiriman pesan massal.
  - *Mitigasi:* Bot Telegram mengizinkan hingga 30 pesan/detik untuk chat yang berbeda, jauh di atas volume event harian Frhm saat ini.
