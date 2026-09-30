# Spec: Analytics Deep Dive — Strategic Gaps for Agency-Grade Reporting

## 1. Overview
Enhance `analytics-client-report` dengan data attribution (WA/DM inquiry), `content_type` & `creative_format` categorization, otomatisasi daily cron AI insight + Telegram briefing, serta antislop-copywriting tanpa emoji/ikon.

## 2. Requirements

### 2.1 Database Schema (Phase 1)
- `scheduled_posts`:
  - `content_type`: `enum('promo', 'educational', 'entertainment', 'ugc')` DEFAULT `'educational'`
  - `creative_format`: `enum('reels', 'carousel', 'static', 'story')` DEFAULT `'reels'`
- `post_metrics`:
  - `wa_inquiries`: `integer` DEFAULT 0
  - `dm_inquiries`: `integer` DEFAULT 0
  - `theme_tag`: `text` NULLABLE

### 2.2 Automated Daily Cron & Telegram Alert
- Endpoint: `GET /api/cron/daily-insight` (diminta via Vercel Cron / external scheduler harian 00:00 UTC / 07:00 WIB).
- Flow:
  1. Fetch semua active clients (`telegram_notifications_enabled = true`).
  2. Hitung agregasi metrik 24 jam / 7 hari terakhir (reach, ER, content mix ratio, WA/DM inquiries).
  3. Panggil AI provider terdaftar via `buildInsightPrompt`.
  4. Simpan ke `analytics_summaries` (`period_type = 'daily'`).
  5. Kirim briefing ke Telegram client/admin via `sendTelegramMessage` tanpa emoji/ikon dekoratif.

### 2.3 Antislop-Copywriting Guidelines
- Bebas emoji / ikon dekoratif di prompt AI, pesan Telegram, export PDF & Markdown.
- Tone: profesional, presisi, fakta & angka konkret, tanpa frasa filler/AI-isms.

### 2.4 UI Updates
- Inline editing & CSV/Paste bulk import di `AnalyticsBoard` mendukung kolom `wa_inquiries`, `dm_inquiries`, `content_type`, `creative_format`.
- Indikator Content Mix Ratio & Attribution Funnel di card `AnalyticsBoard`.
