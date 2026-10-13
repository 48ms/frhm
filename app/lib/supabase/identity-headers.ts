/**
 * Request-header keys used to forward the resolved identity from the
 * middleware (proxy.ts) down to Server Components, so the admin layout does
 * not repeat the `auth.getUser()` + `users` profile queries.
 *
 * Kept in its own module (no next/server, no supabase imports) so Server
 * Components can import the constants without pulling middleware code.
 */
export const USER_HEADERS = {
  id: 'x-user-id',
  email: 'x-user-email',
  role: 'x-user-role',
  name: 'x-user-name',
  clientId: 'x-user-client-id',
} as const
