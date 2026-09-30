# Proposal: Analytics Deep Dive — Strategic Gaps for Agency-Grade Reporting

## Why

Change `analytics-client-report` delivers working monthly reports (PDF/MD, inline edit, AI insight, export). Tapi **5 celah strategis** masih terbuka yang membuat laporan terasa "operator input angka" bukan "analis strategis" — dan owner (Pak Adit, Bunda) akan menanyakan hal-hal ini di review bulanan:

1. **Tidak ada benchmark kompetitor** — "Kita reach 12K, kompetitor berapa?"
2. **Content mix blind** — Tidak tahu promo vs educational vs entertainment ratio
3. **Attribution bisnis hilang** — Reach/clicks ada, WA/DM inquiry nol
4. **Creative fatigue tak terdeteksi** — Format/tema yang sama berulang, ER drop tak tertangkap
5. **Period-over-period lemah** — Hanya WoW, tidak ada MoM/YoY/musiman (Ramadan vs non-Ramadan)

Ini bukan bug — ini *strategic gap* yang bedakan agency commodity vs agency premium. Dipisah dari change utama agar `analytics-client-report` tetap *shippable* minggu ini.

## What Changes

**Phase 1 (High ROI — immediate):**
- `content_type` enum (promo/educational/entertainment/ugc) di `scheduled_posts` + `post_metrics`
- `wa_inquiries`, `dm_inquiries` kolom di `post_metrics` (manual input)
- `creative_format` (carousel/reels/static/story) + `theme_tag` di `post_metrics`
- Extend AI insight prompt: inject mix ratio, attribution, creative fatigue detection, MoM/YoY context

**Phase 2 (Competitor & Seasonal):**
- `competitor_benchmarks` table (3 brand/client, manual input mingguan: reach, ER, post freq)
- `seasonal_periods` reference table (Ramadan, Lebaran, Natal, Back-to-school, dll)
- Insight prompt: competitor gap analysis + seasonal comparison

**Phase 3 (Automation — later):**
- Integrate `competitor-analysis` skill → semi-auto scrape
- Integrate `content-calendar` skill → mix planner
- Integrate `viral-reverse-engineering` skill → creative audit automation

**BREAKING**: Migration menambah kolom di `post_metrics` + `scheduled_posts` + 2 tabel baru. Perlu regenerasi types.

## Capabilities

### New Capabilities
- `analytics/competitor-intel`: Competitor benchmark tracking (manual input v1, skill-integrated v2) untuk gap analysis di insight.
- `analytics/attribution-funnel`: Business outcome metrics (WA/DM inquiry, store visit) yang justify fee agency.
- `analytics/creative-health`: Creative format + theme tagging → fatigue detection + format rotation recommendation.
- `analytics/seasonal-intelligence`: Seasonal period reference + MoM/YoY comparison untuk musiman F&B.

### Modified Capabilities
- `analytics/client-report`: Requirement "Structured AI Insight Generation" → extend prompt template dengan competitor gap, content mix ratio, attribution funnel, creative fatigue, seasonal context.
- `content/trend-engine`: Requirement "Auto Deliverable Creation" → deliverable creation set default `content_type` dari trend source (radar: educational; trend-jack: promo/entertainment).
- `notifications/telegram`: Requirement "Scheduled Content Publishing Status Alert" → tambah alert "Creative fatigue detected: 4 carousel resep berturut-turut, ER drop 35%".

## Impact

**Depends on:** `analytics-client-report` complete (post_metrics, analytics_summaries, insight prompt infrastructure sudah ada).

**Code:**
- `lib/analytics/insight-prompt.ts` — major rewrite: inject 5 konteks baru
- `app/components/analytics/analytics-board.tsx` — kolom baru di tabel + filter
- `app/api/admin/clients/[id]/analytics/metrics/route.ts` — validasi kolom baru
- Migration `030_analytics_deep_dive.sql` — 5 kolom + 2 tabel baru
- `lib/trends/generator.ts` — default `content_type` pada deliverable

**Skill Repo Integration Points (future):**
- `competitor-analysis` skill → `analytics/competitor-intel` automation
- `content-calendar` skill → `analytics/creative-health` mix planner
- `viral-reverse-engineering` skill → `analytics/creative-health` audit
- `seasonal-and-moment-marketing` skill → `analytics/seasonal-intelligence` calendar
- `social-selling-and-dm` + `link-in-bio-and-traffic` → `analytics/attribution-funnel` UTM/tracking

**Risk:** Scope creep kalau di-implementasi bareng change utama. Dipisah sengaja.