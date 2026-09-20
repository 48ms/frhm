# storage-rls Specification

## ADDED Requirements

### Requirement: All private assets use signed URLs and private buckets
The system SHALL NOT store client assets (brand logos, guidelines, invoices) in public buckets. Every file that is not meant for public consumption MUST be stored in a bucket with `public = false` and accessed via `createSignedUrl` with a short-lived token.

#### Scenario: Client uploads a brand logo
- **WHEN** a client uploads a logo via the Brand Assets tab
- **THEN** the file is stored in a private bucket (`public = false`) and the UI retrieves a signed URL that expires in 1 hour

### Requirement: Storage RLS enforces per-tenant isolation
All `storage.objects` operations (upload, delete, list, get) MUST include RLS policies that enforce `client_id` (or `admin` role) scope. Policies MUST NOT use `USING (true)` or allow cross-tenant operations.

#### Scenario: Client A uploads a file
- **WHEN** Client A uploads a file via `/storage/v1/object/brand_assets/...`
- **THEN** the `client_id` (derived from the session) matches the folder path or stored record

#### Scenario: Client A deletes Client B's file
- **WHEN** Client A attempts to delete a file belonging to Client B
- **THEN** the storage RLS policy rejects the operation (403)

### Requirement: All storage buckets have RLS policies
Every bucket created in migration MUST define RLS policies explicitly. Buckets defined in the code but lacking `CREATE POLICY` statements (e.g., `brand_assets`) are invalid.

#### Scenario: New bucket added
- **WHEN** a new bucket (e.g., `deliverable_assets`) is added
- **THEN** migration defines both `public = false` and RLS policies before the bucket is usable