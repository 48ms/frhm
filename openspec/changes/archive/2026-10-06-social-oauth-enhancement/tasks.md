# Tasks

## 1. UI Enhancements

- [x] 1.1 Update `PLATFORM_META` in `ConnectChannelModal` (`app/components/social-accounts/connect-channel-modal.tsx`) to set `available: true` for LinkedIn, YouTube, Twitter, and Facebook, and verify they appear clickable in the UI.

## 2. Server Action Refactoring

- [x] 2.1 Refactor `syncChannel` in `app/features/social-accounts/api/service.ts` to directly fetch Ayrshare profile data (`https://app.ayrshare.com/api/profiles`) using the client's `ayrshare_profile_key` and verify typescript compiles.
- [x] 2.2 Update the `client_channels` table natively within `syncChannel` with the new `avatar_url` and `handle` and verify the sync action completes successfully on a connected account.

## 3. OAuth Callback Error Handling

- [x] 3.1 Import and add `logAudit()` inside the `if (error)` block in `app/api/social/callback/route.ts` to log specific OAuth rejections and verify via the Supabase table or logs.
- [x] 3.2 Add conditional logic to parse specific Ayrshare errors in the callback before redirecting to `/admin/social-accounts?error=...` and verify the frontend toast displays the updated message accurately.
