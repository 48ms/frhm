# migration-consolidation Specification

## ADDED Requirements

### Requirement: All migrations live in a single `app/supabase/migrations` directory
The system SHALL have a single source of truth for database schemas. All `.sql` files defining tables, RLS, or indexes MUST reside in `app/supabase/migrations`. The root `supabase/migrations` directory MUST NOT be used for new schema definitions.

#### Scenario: Schema audit
- **WHEN** a developer runs `ls app/supabase/migrations/`
- **THEN** all 60+ migrations are found in this directory; zero migrations live in root

### Requirement: Root migrations are consolidated before merging
Any schema definitions that currently live in `supabase/migrations` (root) MUST be copied into `app/supabase/migrations` and verified before the root directory is removed or ignored.

#### Scenario: `campaigns` table exists twice
- **WHEN** the schema is analyzed
- **THEN** duplicate definitions in root (`004_analytics.sql`, `20260918071447_social_media_schema.sql`) are resolved into one canonical definition in `app/supabase/migrations`

### Requirement: Every table defining client data must have `client_id` and RLS
All tables that reference client-scoped data MUST:
1. Include a `client_id UUID NOT NULL REFERENCES clients(id)` column
2. Define an RLS policy using `is_admin()` or `current_user_client_id()`

#### Scenario: `kols` table
- **WHEN** `kols` table is created
- **THEN** it includes `client_id` and `CREATE POLICY ... USING (client_id = ...)`

#### Scenario: `tasks` table
- **WHEN** `tasks` table is created
- **THEN** it includes `client_id` and an RLS policy