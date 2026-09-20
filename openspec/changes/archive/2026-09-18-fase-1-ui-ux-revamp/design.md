# Design

## Context
See proposal.md for motivation. The project is a Next.js 14 App Router application with Tailwind CSS and shadcn UI.

## Goals / Non-Goals

**Goals:**
- Implement global navigation layout adjustments on the client and admin views.
- Group the admin navigation items logically.
- Consolidate settings into a centralized view using sub-navigation/tabs.
- Implement a global `cmdk` component for the command palette using shadcn UI's Command component.

**Non-Goals:**
- Fully implement the logic of the backend routes for the new UI elements if they don't already exist.
- Major refactors of existing business logic (focus is strictly UI/UX structural revamps).

## Decisions
- **Command Palette Framework:** Use shadcn's `Command` component (based on `cmdk`) because it integrates perfectly with the existing Tailwind/shadcn setup.
- **Client Mobile Navigation:** We will convert the existing sidebar component for clients into a bottom navigation bar when the viewport is smaller than `md`. This ensures responsiveness.
- **Settings Layout:** We will use a secondary sidebar or a tab-based layout on the `/admin/settings` route to house AI, Bridge, User, and Audit settings.

## Risks / Trade-offs
- **Risk:** Mobile bottom navigation might overlap with floating action buttons or bottom sheet dialogs.
  - **Mitigation:** Ensure sufficient padding is added to the main layout wrapper on mobile.
