# audit-coverage Specification

## ADDED Requirements

### Requirement: All mutation API routes write audit logs
Every API route that writes data (`.insert()`, `.update()`, `.delete()`) MUST call `logAudit()` before or after the mutation. Audit logs are required for compliance, debugging, and security forensics.

#### Scenario: Client creation
- **WHEN** `POST /api/admin/clients` creates a new client
- **THEN** an audit row is written with `action: 'client.create'`

#### Scenario: User deletion
- **WHEN** `DELETE /api/admin/users/[id]` deletes a user
- **THEN** an audit row is written with `action: 'user.delete'`

### Requirement: All admin mutations are logged
Routes under `/api/admin/*` that change system state (AI providers, Telegram config, user accounts) MUST log to `audit_log`.

#### Scenario: AI provider change
- **WHEN** `PATCH /api/admin/ai/providers` changes default model
- **THEN** `action: 'ai.provider.change'` is logged

### Requirement: Deliverable lifecycle is fully audited
Every step of the deliverable workflow (create, publish, send, approve, revision) MUST be logged.

#### Scenario: Deliverable send
- **WHEN** `POST /api/admin/deliverables/[id]/send` sends to client
- **THEN** `action: 'deliverable.send'` is logged

#### Scenario: Deliverable deletion
- **WHEN** `DELETE /api/admin/deliverables/[id]` deletes a deliverable
- **THEN** `action: 'deliverable.delete'` is logged

### Requirement: Login/Authentication events are logged
Successful and failed authentication events MUST be logged with `action: 'auth.signin'` or `action: 'auth.signin_failed'`.

#### Scenario: Admin login
- **WHEN** admin logs in via `/auth/login`
- **THEN** audit row with `action: 'auth.signin'` is written

### Requirement: All cron job runs are logged
Every cron job execution MUST be logged, including success and failure states.

#### Scenario: Publish cron
- **WHEN** `/api/cron/publish` runs
- **THEN** `action: 'cron.publish'` is logged with metadata (count success, count failed)

### Requirement: Audit log is immutable
The `audit_log` table MUST have policies preventing `UPDATE` and `DELETE` operations for all application roles.

#### Scenario: Admin tries to delete an audit entry
- **WHEN** an admin runs `DELETE FROM audit_log WHERE id = 'xxx'`
- **THEN** the RLS policy denies the operation

### Requirement: Audit logs are append-only
The `audit_log` table MUST be append-only. No role except `service_role` can insert, and no role can update or delete.

#### Scenario: Application code inserts audit log
- **WHEN** `logAudit()` is called from an API route
- **THEN** the insert succeeds using `service_role` privileges
