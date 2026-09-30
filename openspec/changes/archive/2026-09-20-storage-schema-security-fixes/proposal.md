# Proposal: Storage & Schema Security Fixes (Consolidated)

## Overview

Deep-dive into storage and schema layer revealed **24 findings**. These concern **how files are stored (public vs private)**, **schema drift**, **missing indexes**, and **security gaps (XSS, spoofing)**.

## Issue S1-S8 (Original) — Summary

| Issue | Status | Fix |
|-------|--------|-----|
| S1: Bucket public | ❌ | Set `public = false` |
| S2: RLS USING(true) | ❌ | Add tenant-scoped policies |
| S3: Root migrations orphaned | ❌ | Move to `app/supabase/migrations/` |
| S4: `campaigns` duplicate | ❌ | Resolve to canonical |
| S5: `kols`/`tasks` no `client_id` | ❌ | Add column |
| S6: No RLS on tables | ❌ | Add policies |
| S7: `Math.random()` naming | ❌ | Use `crypto.randomUUID()` |
| S8: No signed URLs | ❌ | Use `createSignedUrl()` |

## Issue S9-S16 (Schema) — Summary

| Issue | Status | Fix |
|-------|--------|-----|
| S9: `campaigns.client_id` no FK | ❌ | Add constraint |
| S10: `content_assets`/`platform_posts` no `client_id` | ❌ | Add column |
| S11: Zero RLS on tables | ❌ | Add policies |
| S12: Dual parallel systems | ❌ | Merge or align |
| S13: Missing `updated_at` triggers | ❌ | Add trigger |
| S14: `content_items` vs `content_assets` overlap | ❌ | Merge or clarify |
| S15: `content_items` no policy | ❌ | Add policy |
| S16: Client approval no check | ❌ | Add `client_id` filter |

## Issue S17-S24 (New Findings)

| Issue | Finding | Severity |
|-------|---------|----------|
| S17 | Missing indexes on 6 tables | 🟡 MEDIUM |
| S18 | `brand-asset-hub.tsx` dead code + insecure | 🟨 HIGH |
| S19 | File type spoofing | 🟨 HIGH |
| S20 | Stored XSS risk via public bucket | 🟨 HIGH |
| S21 | Client ID spoofing via prop | 🟨 HIGH |
| S22 | No server-side file validation | 🟨 HIGH |
| S23 | No CORS/CSP for public bucket | 🟡 MEDIUM |
| S24 | SEO / Indexing risk | 🟡 MEDIUM |

## Fix Strategy

1.  **Consolidate** — Merge `proposal-v2.md` into this file; remove duplicate `-v2` files.
2.  **Migrate** — Move all root migrations to `app/supabase/migrations/`.
3.  **Secure Storage** — Bucket private, signed URLs, RLS enforced.
4.  **Add Indexes** — Create indexes on `client_id` for all tables.
5.  **Add Validation** — Server-side MIME check, size limit.
6.  **Verify** — Test RLS, indexes, and triggers.