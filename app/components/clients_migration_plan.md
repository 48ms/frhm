# Implementation Plan: Clients Module Migration

## Goal
Port Clients/Module to Luminous Space design system (consistent with Dashboard).

## Proposed Changes

### [MODIFY] app/admin/clients/page.tsx
- Wrap in `PageContainer`.
- Use standard Luminous Space table/grid styling (cards for client list).
- Use `DashboardHeader` for top nav.

### [MODIFY] app/admin/clients/[id]/page.tsx
- Use `PageContainer`.
- Consistent bento layout (KPIs, Active Projects, Client Meta).

## Verification
- Visual consistency with dashboard (mesh, colors, fonts).
- Supabase data integrity (Clients data remains unchanged).
