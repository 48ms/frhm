# Proposal

## Why

Frhm's current UI has grown organically and is starting to suffer from sidebar bloat and cognitive overload. The Admin side lacks a unified "Global Pipeline" view to track all clients at once, while the Client side lacks a mobile-first native feel. We need a professional, enterprise-grade UI/UX foundation (Fase 1) that is clean, scalable, and uses modern open-source component libraries (like Shadcn/UI) to prepare for future Marketing ERP features without "feature creep".

## What Changes

- **Sidebar Reorganization (Admin)**: Group existing flat sidebar items into professional categories (OVERVIEW, AI CORE, CLIENTS, SYSTEM).
- **Settings Consolidation**: Move fragmented settings (AI, Bridge, User, Audit) under a single unified "Settings" wrapper to reduce sidebar bloat.
- **Global Pipeline**: Introduce a unified Kanban board for Admins to view and filter deliverables across all clients simultaneously.
- **Client Mobile Navigation**: Convert the client-side sidebar into a Bottom Navigation Bar for a true mobile-first experience.
- **UI Reskin**: Replace existing custom animations with clean, accessible, and fast components (Tailwind + Shadcn/UI primitives).

## Capabilities

### New Capabilities
- `management/global-pipeline`: A unified Kanban view across all clients for admin monitoring.
- `client/mobile-navigation`: A mobile-first bottom navigation structure for client-facing dashboards.

### Modified Capabilities
- (None - existing `content/trend-engine` and `notifications/telegram` backend logic remains unchanged).

## Impact

- **UI Components**: Major updates to `app/components/app-sidebar.tsx`, `nav-main.tsx`, and the introduction of a new bottom nav component.
- **Pages**: New `/admin/global-pipeline` route, restructuring of `/admin/settings/*` routes.
- **Dependencies**: Potential integration of `shadcn/ui` core primitives if not already fully present.
- **Backend**: Zero impact. Supabase schemas and API routes remain 100% intact.
