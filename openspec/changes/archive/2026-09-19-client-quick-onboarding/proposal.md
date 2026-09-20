# Proposal: Client Quick Onboarding

## Why
Currently, onboarding a new client requires navigating to `/admin/clients`, opening a bare 3-field form (Name, Email, Phone), and manually configuring strategy files (`brand-profile.md`) and skill assignments from scratch. This manual setup takes 20–30 minutes per client and delays access to features like Batch Automations and Content Generation that depend on an existing brand profile. Adding a quick-action trigger in the sidebar and Command Palette combined with an AI-driven smart onboarding wizard reduces time-to-first-campaign from 20 minutes to under 30 seconds.

## What Changes
- **Sidebar Quick Action**: Add an inline `+` button to the `CLIENTS` group header in `AppSidebar` allowing admins to trigger client creation from any page.
- **Command Palette Action**: Register "Tambah Client Baru" / "Create New Client" as an actionable command in `CommandSearch` (`Ctrl+K` / `Cmd+K`).
- **Reusable Client Creation Dialog**: Extract and enhance client creation modal into `@/components/client/create-client-dialog.tsx`.
- **Smart Form Fields**: Enrich the client creation form with 4 marketing foundation fields: Niche/Industry (dropdown), Target Audience, Main Products/Services, and USP/Key Differentiation.
- **Automated Brand Profile Generation**: On client creation, execute an AI pipeline based on social media foundation skills (`brand-profile`, `audience-research`, `voice-builder`, `content-pillars`) to automatically synthesize a valid, structured `brand-profile.md` artifact stored in Supabase storage/database.
- **Automatic Skill Pack Assignment**: Automatically assign relevant default skill packs (e.g., Social Media Starter Kit, Platform-specific packs) based on the chosen niche.

## Capabilities

### New Capabilities
- `client/quick-onboarding`: Smart onboarding flow that accepts basic brand inputs (name, niche, target audience, core product, USP) and automatically orchestrates AI foundation skills to generate `brand-profile.md` and assign initial topic packs.

### Modified Capabilities
- `ui/hierarchical-sidebar`: The `CLIENTS` group header in the sidebar now includes an interactive quick action button (`+`) to launch client onboarding.
- `ui/command-palette`: The command palette includes a direct creation action for new clients alongside search navigation.

## Impact
- **Frontend Components**:
  - `components/app-sidebar.tsx`: Action button in `CLIENTS` group header.
  - `components/admin-command-search.tsx`: Action registration for quick client onboarding.
  - `components/client/create-client-dialog.tsx`: New centralized dialog with enhanced marketing fields.
  - `app/admin/clients/page.tsx`: Refactored to use the shared dialog.
- **Backend & APIs**:
  - `app/api/admin/clients/route.ts`: Enhanced to accept marketing metadata and trigger AI brand profile generation and skill pack seeding asynchronously or synchronously.
  - `lib/ai/` / `lib/skills/`: Routine to orchestrate prompt generation for `brand-profile.md`.
- **Database**:
  - Populates client `brand_profile` JSON and client artifacts table.
  - Inserts entries into `client_skills` based on selected niche.
