# Backend Schema and Forms Specification

## Summary
Resolves critical backend infrastructure issues where 12 database tables are missing from Supabase due to a split migration pipeline, and connects "dead" admin forms that currently do not persist data.

## Affected Areas
- Database Migrations (`supabase/migrations/` vs `app/supabase/migrations/`)
- Admin Planning (`CampaignForm` in `app/admin/planning/new/page.tsx`)
- Content Drafting (`ContentDraftForm` in `components/admin/hero-asset-card.tsx`)

## Priority
**CRITICAL**: Without these tables, 6 admin tabs fail to function correctly. Without the form wiring, the campaign planning module is useless as data is not saved.
