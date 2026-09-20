# Design: Backend Schema & Forms

## Database Migration Consolidation

**Current State:**
```text
/app/supabase/migrations/
  001_...
  035_scheduler_engine.sql
/supabase/migrations/
  004_analytics.sql
  20260918141819_fase_3_erp_tables.sql
```

**Target State:**
Move and rename root migrations to the `app/` folder to ensure a single source of truth.
```text
/app/supabase/migrations/
  001_...
  035_scheduler_engine.sql
  036_root_analytics.sql
  037_social_media_schema.sql
  038_fase_2_content_production.sql
  039_fase_3_erp_tables.sql
```

## API Integration Design

### CampaignForm
**Component:** `components/admin/campaign-form.tsx`
**Action:** Submit to `/api/admin/campaigns`
**Payload:**
```json
{
  "name": "Promo Lebaran",
  "type": "campaign",
  "start_date": "2026-09-01",
  "end_date": "2026-09-30",
  "color": "#3b82f6",
  "notes": "...",
  "pillar_allocation": { "Educational": 30, "Promotional": 20, ... }
}
```

### ContentDraftForm
**Component:** `components/admin/content-draft-form.tsx`
**Action:** Submit to `/api/admin/content-drafts`
**Payload:**
```json
{
  "asset_id": "uuid",
  "title": "...",
  "description": "...",
  "pillars": ["Educational"],
  "funnel_stage": "TOFU"
}
```
