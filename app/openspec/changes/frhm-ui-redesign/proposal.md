# Frhm UI/UX Redesign

## Purpose

Full UI/UX redesign of Frhm admin dashboard using `next-shadcn-dashboard-starter` template patterns while preserving existing Supabase backend, multi-tenant architecture, and 73 API routes.

## Goal

Eliminate cognitive overload from 15-tab workspace, fix navigation inconsistencies, add data filtering/pagination, and modernize visual system with scroll effects, theme support, and proper accessibility patterns.

---

## Current Pain Points

1. **15-tab horizontal workspace** → Admin must scroll horizontally on small screens, hard to find specific tab
2. **Global vs per-client duplication** → `Global Pipeline` and `Pipeline` tab look similar but serve different scopes
3. **No data filtering** → Tables in deliverables, clients, audits have no search/filter/sort
4. **No pagination** → Long lists of deliverables, clients, audit logs have no pagination
5. **Inconsistent action grouping** → Destructive actions (reset password, revoke sessions) mixed with regular actions
6. **Missing UI patterns** → No theme toggle, notification popover, data table with filters, skeleton loading states

## Template Patterns to Adopt

| Pattern | Template Source | Why |
|---------|-----------------|-----|
| `DataTable` + `DataTableToolbar` | `src/components/ui/table/` | Filter, sort, paginate, column options for all tables |
| `Pagination` | `src/components/ui/table/data-table-pagination.tsx` | Consistent pagination across deliverables/clients/audit tables |
| `InfobarProvider` | `src/components/ui/infobar.tsx` | Right-side info panel for context/help, collapsible |
| `KBar` | `src/components/kbar/` | Command palette (already exist in Frhm, just upgrade styling) |
| `Skip to content` link | `src/app/dashboard/layout.tsx` | Accessibility requirement |
| `Theme toggle` | `src/components/themes/theme-mode-toggle.tsx` | Dark mode switch with animation |
| `Notifications` | `src/features/notifications/` | Bell + popover, later full page (All/Unread/Read tabs) |
| `ScrollArea` | `src/components/ui/scroll-area.tsx` | Custom scrollbars matching design system |
| `Shimmer` + `ScrollFade` | `src/styles/globals.css` | Loading skeletons, scroll fade effects |

## What to NOT Port

- **Clerk auth** → Already using Supabase + RLS (73 API routes, multi-tenant)
- **TanStack Query** → Already using `safeQuery` + RSC (fetch manual)
- **nuqs** → URL state management not needed in Frhm current workflow
- **Tabler icons** → Already using lucide-react consistently
- **Billing/Orgs** → Frhm not multi-org SaaS

---

## Verification Plan

**Phase 1** - Shell replacement (`app-sidebar.tsx` → `app-sidebar.tsx` template, `admin/layout.tsx` → template)
- [x] File exists
- [ ] tsc --noEmit
- [ ] eslint pass
- [ ] npm run build pass
- [ ] Manual visual review

**Phase 2** - Workspace consolidation (15 tabs → 5 groups)
- [x] File exists
- [ ] tsc --noEmit
- [ ] eslint pass
- [ ] npm run build pass
- [ ] Manual review (15 → 5 tabs)
- [ ] E2E test: tab count = 5

**Phase 3** - Data components (DataTable + Toolbar + Pagination)
- [x] File exists
- [ ] tsc --noEmit
- [ ] eslint pass
- [ ] npm run build pass
- [ ] Integrate to deliverables table
- [ ] Manual test (filter + paginate)

**Phase 4** - Polish (theme toggle, notification, skeleton)
- [x] File exists
- [ ] tsc --noEmit
- [ ] eslint pass
- [ ] npm run build pass
- [ ] Manual test (dark mode, notification)
