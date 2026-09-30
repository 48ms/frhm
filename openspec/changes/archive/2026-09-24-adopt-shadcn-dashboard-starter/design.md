## Context

Frhm is a digital marketing SaaS platform currently powered by Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (Base UI primitives), and Supabase (PostgreSQL, Auth, RLS). Currently, client-facing views (specifically for Taraju) suffer from mixed navigational controls, cognitive overload, and indistinct action hierarchies. See `proposal.md` for full background and motivation.

We adapt architectural patterns and visual tokens from `next-shadcn-dashboard-starter` while retaining Supabase as the underlying identity and data provider.

## Goals / Non-Goals

**Goals:**
- Implement a clear Information Architecture separating Admin and Client views completely.
- Structure client features into 3 core pillars: Review Content, Approval, and Reports.
- Establish strict visual hierarchy: 1 primary action per view, secondary/ghost for passive actions, destructive red for rejection/deletion, and overflow menus for secondary options.
- Extract unified design tokens (colors, font, spacing) from `next-shadcn-dashboard-starter` into Frhm.
- Execute an incremental migration starting with a single pilot page (Approval board) before touching other views.
- Conduct a real-world usability test with Taraju (Pak Adit) to validate workflow clarity.

**Non-Goals:**
- **No Clerk Migration:** Clerk Auth, Clerk Organizations, and Clerk Billing are explicitly rejected. All multi-tenancy, authentication, and permissions remain strictly on Supabase.
- **No Big-Bang Rewrite:** Do not re-architect all dashboard pages at once.
- **No Database Schema Overhaul:** Existing Supabase tables, RPCs, and RLS policies remain functional without breaking schema alterations.

## Decisions

### Decision 1: Keep Supabase Auth, Adapt Only UI/UX Patterns from Template
- *Rationale:* Frhm already has a functional Supabase backend with established tables, RLS policies, and client scopes. Replacing it with Clerk would introduce massive regression risk and unnecessary third-party subscription overhead.
- *Alternatives Considered:* Full template clone including Clerk — rejected due to incompatibility with current backend investments and active client data.

### Decision 2: Feature-Based Directory Structure
- *Rationale:* Follow the template's pattern of organizing code by domain/feature (`components/client/approvals`, `components/client/review`, `components/client/reports`, `components/shared/layout`) rather than one flat folder of components.
- *Alternatives Considered:* Keeping current flat components directory — rejected because it causes code sprawling and high cognitive friction during maintenance.

### Decision 3: Standardized Action Hierarchy & Overflow Menus
- *Rationale:* To reduce client cognitive load, every view must have exactly one obvious primary call-to-action (CTA). Low-frequency actions (export, history, duplicate) are moved to an overflow dropdown menu (`DropdownMenu` with `MoreHorizontal` icon).
- *Alternatives Considered:* Exposing all buttons in a top bar — rejected because it overwhelms non-technical clients.

### Decision 4: Phased Single-Page Pilot Rollout
- *Rationale:* Trying to overhaul all views simultaneously causes widespread regressions. Rolling out the new design system to the **Approval** page first allows end-to-end verification of actions (Approve, Request Changes, Notes) without jeopardizing content creation or reporting pipelines.
- *Alternatives Considered:* Re-styling the entire app in one commit — rejected due to high regression risk.

## Risks / Trade-offs

- **[Risk] Regression in Supabase data fetching or mutation handlers during UI restyle**  
  → *Mitigation:* Decouple UI presentation components from data-fetching hooks; maintain existing mutation signatures and verify each action manually and via tests.
- **[Risk] Tailwind CSS v4 token mismatch between template and existing setup**  
  → *Mitigation:* Extract tokens into centralized CSS variables (`app/globals.css`), previewing buttons and cards in isolation before page integration.
- **[Risk] Client resistance or disorientation from UI changes**  
  → *Mitigation:* Maintain familiar terminology and execute Tahap 6 (Usability Check with Pak Adit) before freezing the design.
