# Taraju Client Dashboard Constitution

## Core Principles

### I. Admin-Controlled, Client-Restricted
Admin (Bima) is the only role that can create, edit, or delete a deliverable. Client role is strictly read + approve/comment. This boundary MUST be enforced at the database/auth level (Row Level Security), not just hidden in the UI — a client hitting the API directly must still be blocked.

### II. Single Source of Truth per Deliverable
Every brief, content draft, or report lives as exactly one record with a full status and comment history. Once something is in the dashboard, it is not duplicated or re-sent via WhatsApp/email as the "real" version — the dashboard record is authoritative.

### III. Simple Over Scalable (NON-NEGOTIABLE)
Ship the smallest working version for Taraju before generalizing to multi-client. No speculative abstraction (multi-tenant UI, billing, roles beyond admin/client) ahead of an actual second client signing on.

### IV. Transparent Feedback Loop
Every status change and every comment is visible and timestamped to both roles. Nothing is edited or deleted invisibly — if a mistake is made, it is corrected with a new entry, not by erasing history.

### V. Low-Friction Client Experience
Client login and actions must require minimal technical skill: one clear way to log in, big unambiguous Approve/Minta Revisi buttons, no technical jargon anywhere in the client-facing UI.

## Technical Constraints

Stack is fixed for MVP: Next.js 14 (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres + Auth + Storage), deployed on Vercel. No custom backend server outside Supabase for MVP — if a need arises that Supabase can't cover, it gets flagged and discussed before adding new infrastructure.

## Development Workflow

Bima is sole developer and reviewer for MVP. Features are built and validated phase-by-phase (per plan.md) — each phase's checkpoint must work end-to-end before starting the next. No formal PR process needed at this scale, but no skipping a checkpoint to "come back to it later."

## Governance

This constitution governs decisions until the Taraju MVP ships. Revisit and amend explicitly (update this file, note the reason) before making a change that contradicts a principle here — especially before adding a second client, which will require re-examining Principle III.

**Version**: 1.0.0 | **Ratified**: 2026-09-13 | **Last Amended**: 2026-09-13
