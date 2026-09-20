## Context

Sistem Frhm telah memiliki repositori 106 skill media sosial (`social-media-skills/`), database Supabase untuk materi deliverable (`deliverables`), dan integrasi notifikasi Telegram (`lib/telegram/service.ts`). Klien seperti Taraju dan Pawon Sengon membutuhkan materi konten yang relevan dengan dinamika media sosial harian tanpa mengorbankan kualitas atau keamanan brand.

## Goals / Non-Goals

**Goals:**
- Membangun service scanner tren (`lib/trends/radar.ts`) yang mengambil umpan tren pencarian Google Trends Indonesia (`geo=ID`) secara gratis dan mengelompokkannya per pilar industri.
- Menyediakan modul evaluasi The Three Gates (`lib/trends/validator.ts`) yang menghitung skor Fit (0-100), Safety (0-100), dan Timing (0-100) terhadap `brand-profile.md` klien.
- Mengintegrasikan generator konten dengan formula 3 variasi hook pembuka (Contrarian, Story, Direct Value) per materi konten.
- Menyediakan UI interaktif di dashboard admin: widget Radar Tren Harian dan input bar Trend-Jack Cepat.
- Mengalirkan materi yang lolos seleksi langsung ke tabel `deliverables` dan mengirimkan notifikasi instan ke Telegram bot Frhm (@frhm28_bot).

**Non-Goals:**
- Otomatisasi langsung mempublikasikan postingan ke Instagram/TikTok tanpa persetujuan klien/admin (tetap tunduk pada prinsip *Human-in-the-Loop*).
- Scraping ilegal atau penggunaan API berbayar mahal seperti Brandwatch.

## Decisions

1. **Google Trends RSS Feed untuk Radar Tren Otomatis**
   * *Keputusan:* Menggunakan endpoint publik `https://trends.google.com/trending/rss?geo=ID` yang diparsing di serverless route.
   * *Alasan:* Bebas biaya kuota API, resmi dari Google, dan mencerminkan lonjakan topik pencarian nyata masyarakat Indonesia secara harian.
   * *Alternatif yang dipertimbangkan:* Third-party scraper API (ditinggalkan karena membutuhkan biaya langganan bulanan mahal).

2. **Struktur Penyimpanan 3 Variasi Hook**
   * *Keputusan:* Format konten markdown di `deliverables.content_md` distandarisasi untuk menyertakan blok opsi Hook:
     - `### Opsi Hook 1 (Contrarian)`
     - `### Opsi Hook 2 (Storytelling)`
     - `### Opsi Hook 3 (Direct Value)`
     diikuti oleh skrip/caption tubuh konten.
   * *Alasan:* Kompatibel 100% dengan UI pembaca konten yang sudah ada (`app/app/client/deliverables/[id]/page.tsx` dan markdown parser) tanpa memerlukan migrasi skema tabel yang memecah komponen.

3. **In-Context Two-Step Generation (Evaluation -> Production)**
   * *Keputusan:* Menggunakan proses 2 tahap:
     1. Evaluasi gerbang (Three Gates) terlebih dahulu. Jika skor tidak aman atau tidak fit, proses berhenti dengan pesan penolakan yang jelas.
     2. Hanya jika lolos evaluasi, model mengeksekusi penulisan skrip lengkap beserta 3 variasi hook.
   * *Alasan:* Menghindari pemborosan token AI dan mencegah konten sampah diproduksi.

## Risks / Trade-offs

- **[Risk]** Format XML Google Trends RSS berubah atau mengalami pembatasan frekuensi (*rate limit*).
  - *Mitigasi:* Terapkan caching in-memory/database selama 3 jam dan sediakan *fallback dataset* tren F&B lokal jika RSS sedang tidak merespons.
- **[Risk]** AI menggeneralisasi hook yang terlalu clickbait atau melenceng dari karakter brand.
  - *Mitigasi:* Masukkan batasan (*guardrails*) tegas dari `voice.md` klien ke dalam system prompt generator hook.
