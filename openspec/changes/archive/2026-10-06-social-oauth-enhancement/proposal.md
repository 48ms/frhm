# Proposal

## Why
Frahma currently relies on a legacy bridge abstraction (WoopSocial) for refreshing channel profiles, which breaks the syncing feature, and artificially limits OAuth connections to just Instagram and TikTok despite Ayrshare supporting all major platforms natively. We need to finalize the transition to Ayrshare, unblock all supported platforms, and ensure robust error handling during the OAuth flow to provide a seamless user experience.

## What Changes
- Unlock LinkedIn, YouTube, Twitter, and Facebook in the UI (`ConnectChannelModal`) by marking them as available.
- Refactor `syncChannel` Server Action to directly query the Ayrshare API for updated profile data instead of invoking a legacy Supabase edge function.
- Add robust error handling in the OAuth callback (`/api/social/callback/route.ts`) to log audit events on failure and parse specific Ayrshare errors for the user interface.

## Capabilities

### New Capabilities
- `social/oauth-connection`: Manages the OAuth lifecycle for client social media accounts, including connection, profile synchronization, and error auditing via Ayrshare bridge.

### Modified Capabilities

## Impact
- `app/components/social-accounts/connect-channel-modal.tsx`: UI changes to enable platforms.
- `app/features/social-accounts/api/service.ts`: Backend refactor for `syncChannel`.
- `app/api/social/callback/route.ts`: Improved error parsing and audit logging.
