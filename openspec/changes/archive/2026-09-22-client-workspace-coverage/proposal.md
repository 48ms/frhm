# Proposal: Client Workspace & Dynamic Route Coverage

## Context

Previous admin sweep (21 static routes) passed all 51 E2E tests. However, **4 dynamic `[id]` routes** and **7 client portal pages** were never tested. This gap left critical bugs undetected.

## Problem

- `/admin/clients/[id]` (workspace) causes **server hang** — port accepts connections but requests timeout after 60-120s
- Client portal pages use **Supabase Realtime websocket** (`DeliverableNotifier`) → `networkidle` never settles
- 0% coverage of dynamic admin routes and client portal

## Proposed Solution

1. Write new E2E spec: `e2e/admin-client-dynamic-routes.spec.ts`
2. Fix test patterns: use `domcontentloaded` + selector waits
3. Document all bugs found with evidence

## Scope

- Admin dynamic routes: `/admin/clients/[id]`, `/admin/crm/[id]`, `/admin/deliverables/[id]`, `/admin/skills/[id]`
- Client portal: `/client/dashboard`, `/client/deliverables`, `/client/calendar`, `/client/pipeline`, `/client/settings`, `/client/approvals`, `/client/deliverables/[id]`

## Out of Scope

- Server hang root cause investigation (requires DB table probe)
- Adding error boundaries to workspace (separate change)
