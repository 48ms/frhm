# Content Intelligence Suite (CIS) — OpenSpec Specification

## Executive Summary

Implementasi Content Intelligence Suite (CIS) untuk Frhm SaaS — multi-client dashboard digital marketing. Tujuan: meningkatkan analytics konten dengan NLP-based sentiment analysis, otomatisasi penerbitan, benchmarking multi-client, & rekomendasi AI — seluruhnya didukung oleh AI lokal (Ollama) untuk menghindari biaya eksternal.

**Status:** Milestone 1 (Sentiment Analysis) & Milestone 2 (Scheduler Engine) selesai 100%. Semua fitur terverifikasi via Playwright E2E test (5/5 PASS), TSC exit 0, dan npm run build exit 0.

## Business Drivers

1. **Sentiment Analysis via Local AI** — Menggunakan Ollama (gpt-oss:120b default) untuk NLP processing agar tidak ada biaya eksternal & selalu sesuai kebijakan anti-emoji.
2. **Dual Telegram Dispatch** — Cron job kirim laporan ke bot internal (@frhm28_bot) dan grup client secara bersamaan — hanya ke grup client bila `telegram_notif_enabled = true`.
3. **Comment Details Storage** — Field JSONB `comment_details` & `sentiment_summary` di `post_metrics` untuk menyimpan komentar mentah & hasil klasifikasi sentiment.
4. **Anti-Slop Copywriting** — Semua prompt AI & laporan Telegram (bot & client) dilarang pakai emoji/ikon — mengacu pada aturan `/antislop-copywriting`.
5. **OpenSpec Proposal Format** — CIS disimpan sebagai OpenSpec change proposal untuk traceability & approval stakeholder.

## Core Modules

| Modul | Deskripsi | Status |
|-------|-----------|--------|
| **Sentiment Analysis Engine** | Modul NLP Ollama-based dengan interface `SentimentResult { sentiment: 'positive'\|'negative'\|'neutral', confidence: number }` & `aggregateSentiments()`. Sudah terintegrasi ke `/api/cron/daily-insight`. | ✅ Selesai |
| **Scheduler Engine** | Endpoint `/api/cron/publish` untuk otomasi penerbitan ke platform sosial via WoopSocial Bridge API. Fitur: retry logic (max 3x), `publish_retry_count`, `external_post_id`, status tracking. | ✅ Selesai |
| **Dashboard UI** | Widget `SentimentOverviewCard` di `AnalyticsBoard` menampilkan ringkasan Positif/Netral/Negatif dari komentar. Badge `Retry x/3` untuk post yang gagal publish. | ✅ Selesai |
| **Database Schema** | Migrasi 034: `comment_details` JSONB & `sentiment_summary` JSONB di `post_metrics`. Migrasi 035: `external_post_id`, `publishing_status` (diganti `status`), `publish_retry_count`, `caption_scheduled_at` di `scheduled_posts`. | ✅ Selesai |

## Technical Approach

- **NLP Model:** Ollama lokal (gpt-oss:120b default), endpoint `localhost:11434`. All AI output lewat filter anti-emoji/ikon (/antislop-copywriting).
- **Database:** Supabase Postgres dengan Management API PAT. DDL via `scripts/sbq.py`. Kolom JSONB untuk `comment_details` & `sentiment_summary`.
- **Cron Jobs:** Vercel Cron: `/api/cron/daily-insight` (sentiment + Telegram dispatch, jam 07:00 WIB) & `/api/cron/publish` (publish posting, setiap 15 menit).
- **Anti-Slop Enforcement:** Semua prompt AI, template notifikasi Telegram, & laporan Markdown/PDF dilarang pakai emoji/ikon dekoratif. Gunakan kata-kata yang jelas & bisnis profesional.
- **Type Safety:** Semua file TypeScript dilintasi (`npx tsc --noEmit` exit 0) dan ESLint (`0 warnings`).

## Dependencies

- **Ollama** — `localhost:11434`, model `gpt-oss:120b`
- **Supabase** — Project URL: `https://tkwplrhkgfncprvezplk.supabase.co`, Service Role Key tersedia
- **WoopSocial Bridge** — API key untuk Instagram/TikTok posting
- **Telegram Bot** — `@frhm28_bot` untuk dispatch laporan harian
- **Vercel** — Untuk Cron job scheduling

## Deliverables

1. **`app/supabase/migrations/034_comment_sentiment_analysis.sql`** — DDL `comment_details` & `sentiment_summary` JSONB
2. **`app/supabase/migrations/035_scheduler_engine.sql`** — 5 kolom baru di `scheduled_posts`
3. **`lib/nlp/sentiment.ts`** — Modul sentiment analysis Ollama
4. **`lib/analytics/insight-prompt.ts`** — Template prompt AI dengan `{sentiment_summary}`
5. **`lib/telegram/messages/daily-briefing.ts`** — Format laporan admin & client (anti-emoji)
6. **`app/api/cron/daily-insight/route.ts`** — Cron harian sentiment + Telegram dispatch
7. **`app/api/cron/publish/route.ts`** — Endpoint publish WoopSocial bridge + retry logic
8. **`app/components/analytics/sentiment-overview-card.tsx`** — Widget UI sentiment
9. **`app/components/analytics/AnalyticsPhase4.test.ts`** — Playwright E2E test suite (5/5 PASS)
10. **`app/lib/telegram/messages/daily-briefing.ts`** — Format laporan harian

## Known Issues & Limitations

- **Ollama harus running** di `localhost:11434` dengan model `gpt-oss:120b`
- **Client harus terdaftar** di Supabase dengan `telegram_chat_id` & `telegram_notif_enabled = true` untuk kirim laporan ke grup
- **Max 3 retry** untuk publish sebelum status permanen `failed`
- **Tidak ada emoji/ikon** dalam output AI & laporan Telegram (anti-Slop rule)
- **Publish hanya suport** platform yang terintegrasi via WoopSocial Bridge (Instagram, TikTok dst.)

## OpenSpec Archive

- **`openspec/changes/archive/`** — Riwayat proposal yang sudah selesai/dilaporkan
- **`.gitkeep`** di folder archive untuk tracking versi

---
*OpenSpec Specification — Frhm Content Intelligence Suite*
*Dihasilkan berdasarkan implementasi Milestone 1 & 2 yang telah diverifikasi.*