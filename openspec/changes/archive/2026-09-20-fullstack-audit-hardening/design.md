# Design: Fullstack Audit & Hardening

## RLS Policy Design

The core fix is replacing `USING (true)` with tenant-scoped policies. Two helper functions are introduced to keep policies readable and DRY.

```sql
-- 036_rls_tenant_isolation.sql

-- Helper: the client_id of the current user (NULL for admins without a client)
CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT client_id FROM public.users WHERE id = auth.uid();
$$;

-- Helper: is the current user an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;
```

Every client-scoped table gets one policy pair:

```sql
CREATE POLICY tenant_read ON public.events
  FOR SELECT TO authenticated
  USING (is_admin() OR client_id = current_client_id());

CREATE POLICY tenant_write ON public.events
  FOR ALL TO authenticated
  USING (is_admin() OR client_id = current_client_id())
  WITH CHECK (is_admin() OR client_id = current_client_id());
```

Tables to receive the policy pair:
- `events`, `event_tasks`, `event_vendors`
- `client_budgets`, `expenses`, `ad_spend_logs`
- `kols`, `brand_assets`

Tables needing `ENABLE ROW LEVEL SECURITY` first:
- `platform_posts`, `content_assets`, `content_items`

## API Route Pattern

Replace direct client-side writes with routes that validate ownership server-side:

```ts
// app/api/admin/events/route.ts
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role, client_id').eq('id', user.id).single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  // ... insert with validated client_id
}
```

## Error Boundary Design

`page.tsx` data loading changes from "all-or-nothing" to partial:

```ts
async function safeQuery<T>(fn: () => Promise<{ data: T | null; error: PostgrestError | null }>) {
  try {
    const { data, error } = await fn()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (e) {
    return { data: null, error: (e as Error).message }
  }
}
```

Each section renders its own error notice if its query failed.

## File Lazy Load

```ts
// Before: all content in memory
supabase.from('client_files').select('path, content')

// After: list only, content on demand
supabase.from('client_files').select('path, updated_at')
// GET /api/admin/clients/[id]/files?path=brand-profile.md → { content }
```

## Files to Modify

| File | Change |
|------|--------|
| `app/supabase/migrations/036_rls_tenant_isolation.sql` | New — RLS policies |
| `app/admin/clients/[id]/page.tsx` | try/catch + lazy file list |
| `app/admin/clients/[id]/setup.tsx` | Remove CommandCenterView dead code |
| `app/admin/clients/[id]/pipeline/board.tsx` | Remove unused props (or add DnD) |
| 16 components listed in proposal Issue 2 | Move writes to API routes |
| `lib/types.ts` | New — consolidated types |