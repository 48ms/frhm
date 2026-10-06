# Design

## Context

Frahma's social accounts board currently displays connected channels and manages OAuth via Ayrshare. However, the UI hardcodes availability for several supported platforms to `false`, and the sync function relies on a non-existent Supabase Edge Function left over from a previous bridge provider (WoopSocial). The callback endpoint redirects users on error without logging audit events or providing structured error handling.

## Goals / Non-Goals

**Goals:**
- Enable OAuth for YouTube, LinkedIn, Twitter, and Facebook using the existing Ayrshare configuration.
- Implement a Server Action to fetch profile updates from Ayrshare API to replace the old Edge Function.
- Ensure OAuth failures log an audit event and cleanly redirect with structured error parameters.

**Non-Goals:**
- Refactoring the entire Ayrshare Bridge architecture (only fixing specific OAuth/sync gaps).
- Adding new social network providers outside of what Ayrshare natively supports.

## Decisions

1. **Enable all platforms in `ConnectChannelModal`**:
   - *Rationale*: Ayrshare already supports them. `toBridgePlatform` correctly maps them. The UI `PLATFORM_META` object just needs its `available` flags toggled to `true`.

2. **Refactor `syncChannel` Server Action**:
   - *Rationale*: Calling the deprecated `sync-social-account` Edge Function breaks synchronization.
   - *Approach*: Read `ayrshare_profile_key` from `clients` table, perform a `fetch` to `https://app.ayrshare.com/api/profiles`, parse the relevant platform object, and update `client_channels` natively in the Server Action using PostgreSQL.
   - *Alternative*: Port the logic to a new Edge Function. *Rejected* because the logic is simple enough for a Next.js Server Action, which aligns with the rest of the Frahma backend service layer.

3. **Callback Error Handling**:
   - *Rationale*: Provider rejection (e.g., user hits cancel on Facebook) simply returns an `error` query param.
   - *Approach*: Add `logAudit()` inside the `if (error)` block in `/api/social/callback/route.ts` and ensure the redirect correctly encodes the error message for `social-accounts-board.tsx` to read.

## Risks / Trade-offs

- **Risk**: Ayrshare API rate limits during manual syncing.
  - *Mitigation*: The `syncChannel` logic only executes on-demand when a user clicks the sync button. If a rate limit is hit, we will handle the API error gracefully.
- **Risk**: Existing connected platforms have slightly different profile data structures in Ayrshare.
  - *Mitigation*: Ayrshare standardizes the profile response under `<platform>.picture` and `<platform>.username`, so reading `profiles[platform.toLowerCase()]` is safe across platforms.
