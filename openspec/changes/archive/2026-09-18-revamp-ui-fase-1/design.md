# Design

## Context

See proposal.md for motivation. The application currently utilizes Tailwind CSS, `animate-ui`, and `spectrumui`. The codebase has a flat sidebar structure (`app/components/app-sidebar.tsx`) that lists all routes. As we plan to add Marketing ERP features later (KOL, Ads, Budget), the UI needs to be structured modularly now to support future expansions. We are implementing a Zero-Budget strategy by leveraging free open-source component libraries.

## Goals / Non-Goals

**Goals:**
- Implement a hierarchical, grouped sidebar for the Admin view.
- Wrap all configuration routes (AI, Bridge, User, Audit) under a unified `/admin/settings` layout.
- Build a robust Bottom Navigation bar for the Client view that activates on mobile viewports.
- Utilize Shadcn/UI (or existing radix-based primitives) to keep the app lightweight and consistent.

**Non-Goals:**
- Do not modify backend Supabase schemas or API routes.
- Do not build the KOL, Ads, Event, or Budget modules in this phase.
- Do not change existing authentication flows.

## Decisions

- **Decision 1: Sidebar Grouping Strategy**
  - *Approach:* Update `NavMain` in `app-sidebar.tsx` to accept and render grouped headers (e.g., "OVERVIEW", "AI CORE", "CLIENTS", "SYSTEM").
  - *Rationale:* Native support in modern UI kits like Shadcn/UI allows easy collapsible groups without massive layout rewrites.
- **Decision 2: Client Mobile Navigation**
  - *Approach:* Render `app-sidebar.tsx` normally on desktop (md and above), but hide it on mobile (`hidden md:flex`). Create a new `bottom-nav.tsx` component that renders fixed to the bottom only on mobile (`flex md:hidden`).
  - *Rationale:* Ensures true mobile-first UX for clients who primarily access via mobile, without sacrificing desktop usability for those who do use desktop.
- **Decision 3: Global Pipeline Kanban**
  - *Approach:* Create `/admin/global-pipeline` using existing Supabase hooks to fetch *all* deliverables, ignoring the client filter parameter initially, then group by status.
  - *Rationale:* Reuses existing data fetching logic, just mapping the result set differently on the frontend.

## Risks / Trade-offs

- [Risk] Layout shifts during transition from desktop sidebar to mobile bottom nav. -> Mitigation: Use strict Tailwind breakpoints (`md:`) and test across devices to ensure seamless transition.
- [Risk] Settings routes are currently top-level; moving them under `/settings` might break existing links. -> Mitigation: Implement Next.js redirects in `next.config.mjs` for the old setting URLs.
