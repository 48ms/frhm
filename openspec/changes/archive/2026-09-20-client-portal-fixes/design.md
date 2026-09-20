# Design: Client Portal Fixes

## UI Changes

### Bottom Navigation

**Before**: 6 items di grid 5 kolom → wrap
**After**: 6 items di grid 6 kolom → tidak wrap

**Changes**:
- `components/bottom-nav.tsx` line 61: `grid-cols-5` → `grid-cols-6`

### Client Settings Page

**New**: `/client/settings`
- Profile form (full_name, email, phone)
- Password change dialog
- Telegram connection preferences

## Spec Changes

### Mobile Navigation

**Change**: `openspec/specs/client/mobile-navigation/spec.md`
```diff
- THEN a client has 2 deliverables in 'review' status
+ THEN a client has 2 deliverables in 'revision_requested' status
```

### ROI Dashboard

**Split**:
- `openspec/specs/client/roi-dashboard-basic/spec.md` (1-2 scenario, simplified charts)
- `openspec/specs/admin/roi-dashboard/spec.md` (existing, admin details)

## DB Changes

### New Tables

```sql
-- Brand Assets
CREATE TABLE brand_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT, -- logos, fonts, colors, guidelines, raw_footage
  file_path TEXT,
  file_type TEXT,
  guidelines TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback
CREATE TABLE feedback_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Storage Bucket

- Name: `brand_assets`
- Policy: public read for client, admin read/write
- Max file size: 10MB

## Database Changes

### Existing (Already Migrated)

- `events`, `event_tasks`, `event_vendors`, `client_budgets`, `expenses`, `ad_spend_logs`

**Status**: Migration file exists → needs push to Supabase

## Files to Modify

| File | Change |
|------|--------|
| `components/bottom-nav.tsx` | `grid-cols-5` → `grid-cols-6` |
| `app/client/layout.tsx` | Update pendingCount status filter → `revision_requested` |
| `openspec/specs/client/mobile-navigation/spec.md` | Update scenario text |
| `openspec/specs/client/` | Add `roi-dashboard-basic` spec |

## Files to Create

| File | Purpose |
|------|---------|
| `app/client/settings/page.tsx` | Settings page (profile, password, telegram) |
| `app/client/settings/page-client.tsx` | Client component |
| `app/client/settings/` | Form components |

## Migration Push

**Command**:
```bash
# Check migration status
supabase migration status

# Push all migrations
supabase db push
```

**Alternative** (direct):
```bash
# Use pg_dump/psql
psql postgresql://user:pass@host/db < supabase/migrations/20260918141819_fase_3_erp_tables.sql
```
