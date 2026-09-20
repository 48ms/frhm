# cron-automation Specification

## ADDED Requirements

### Requirement: All automation routes are registered and scheduled
Every background automation route (`/api/cron/*`) MUST be registered in `vercel.json` or an equivalent scheduler so it runs automatically. Routes that exist in code but are not registered never execute.

#### Scenario: publish cron runs automatically
- **WHEN** a scheduled_post has `status = 'scheduled'` and `scheduled_at <= now`
- **THEN** the publish cron executes within 1 minute and posts via the Bridge API

#### Scenario: check-zero-metrics runs automatically
- **WHEN** it is 07:00 UTC daily
- **THEN** the zero-metrics escalation check runs and notifies admin via Telegram for any post with 0 views

### Requirement: Cron routes require CRON_SECRET authentication
Every cron endpoint MUST verify `Authorization: Bearer <CRON_SECRET>` header before executing. Routes that rely on `getUser()` (which requires a browser session) will fail when called by Vercel Cron or external schedulers, because those callers have no session cookie.

#### Scenario: External scheduler calls publish endpoint
- **WHEN** Vercel Cron sends a request to `/api/cron/publish`
- **THEN** the route validates `CRON_SECRET` in the Authorization header and executes

#### Scenario: Unauthenticated request to cron endpoint
- **WHEN** an anonymous request hits any `/api/cron/*` route without `CRON_SECRET`
- **THEN** the route returns 401 Unauthorized

### Requirement: PostDialog refreshes parent after mutation
PostDialog (Calendar scheduling) MUST call its `onSave`/`onDelete` callback after every successful write, and the parent component MUST use that callback to refetch or update its local state.

#### Scenario: Post created via PostDialog
- **WHEN** admin creates a scheduled post via PostDialog in the Calendar or Production board
- **THEN** the parent board refetches and the new post appears without a page reload

### Requirement: Form modals provide deterministic refresh
Every form modal (Budget, Expense, AdSpend, KOL, Event, Content, Post) MUST either:
1. Accept an `onSuccess` callback that the parent uses to refetch data, OR
2. Call `router.refresh()` internally after successful submit

The parent MUST wire `onSuccess` to a function that updates its state (local optimistic update or full refetch).

#### Scenario: Budget created
- **WHEN** BudgetFormModal succeeds
- **THEN** the Budget tab's `budget` state updates immediately showing the new budget row

#### Scenario: Expense created
- **WHEN** ExpenseFormModal succeeds
- **THEN** the Budget tab's `expenses` state includes the new row AND `remaining_balance` recalculates
