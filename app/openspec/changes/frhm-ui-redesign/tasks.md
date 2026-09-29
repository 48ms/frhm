# Tasks

## Phase 1: Shell Replacement ✅

- [x] Copy `app-sidebar.tsx` from template (src/components/layout/app-sidebar.tsx)
  - Adapt navGroups to Frhm existing routes (OVERVIEW, OPERATIONS, CLIENTS, AI CORE, SYSTEM)
  - Keep existing `brand-accent` active state → now via centralized NavMain renderer
- [x] Copy `admin/layout.tsx` header
  - Add `skip-link.tsx` for accessibility
  - Keep `SidebarTrigger` + separator + breadcrumbs
  - Keep existing notification bell (skeleton)
  - Keep existing user avatar dropdown
- [x] Add `skip-link.tsx` component
  - `hidden` until focus, `visible` when focused
  - Target: `#main-content`
- [x] Fix `isActive` sidebar bug → centralized to `hooks/use-nav.ts` (`isActiveFor`)
- [x] Centralized nav config → `config/nav-config.ts` (NavItem/NavGroup types + Frhm grouping)
- [x] Extracted `nav-main.tsx` → generic reader from config (no hardcoded groupings in app-sidebar)
- [x] Verify: `npx tsc --noEmit` → exit 0
- [x] Verify: `npx eslint` → 0 errors, 0 warnings
- [x] Verify: `npx next build` → compiled successfully

## Phase 2: Workspace Consolidation (15 tabs → 6 groups) ✅

- [x] Edit `workspace.tsx` `Tabs`
  - Replace 15 `TabsTrigger` with 6 groups:
    - Setup: Client Setup (+ Skills)
    - Radar: Radar Tren
    - Produksi: Production Board, Content Calendar, Event Workspace
    - Marketing: Budget Ledger, Ads Tracker, ROI Dashboard
    - Insight: Analytics, Feedback, Pipeline
    - Output: Deliverable, Brand Assets, Hasil
- [x] Fix `isActive` sidebar bug (app-sidebar.tsx:208) → centralized in `nav-main.tsx` + `use-nav.ts`
- [x] Separate destructive actions in `workspace.tsx`
  - Move `Reset Password` + `Cabut Session` to `⋯` menu
  - Keep only `Simpan` visible
- [x] Verify: `tsc --noEmit` → exit 0
- [x] Verify: `eslint` → 0 errors, 0 warnings
- [x] Verify: `npm run build` → compiled successfully

## Phase 3: Data Components ✅

- [x] Create `components/ui/table/data-table.tsx`
  - `Table` primitives from `@/components/ui/table` (new)
  - Sticky-ready header, empty state, action bar
  - Note: app uses `@tanstack/react-table@8.21.3` (aligned to template v8 API)
- [x] Create `components/ui/table/data-table-toolbar.tsx`
  - Search input + reset button
- [x] Create `components/ui/table/data-table-pagination.tsx`
  - Rows per page select
  - Page X of Y
  - First/Prev/Next/Last buttons
- [x] Added `components/ui/table.tsx` primitives + `components/ui/scroll-area.tsx`
- [x] Verify: `tsc --noEmit` → exit 0
- [x] Verify: `eslint` → 0 errors, 0 warnings
- [x] Verify: `npm run build` → compiled successfully

## Phase 4: Integration to Deliverables Tab ✅

- [x] Edit `components/deliverable/deliverable-data-table.tsx` (new file)
  - Create DataTable component using `@tanstack/react-table@8.21.3`
  - Columns: Judul, Tipe, Status, Client, Diupdate
  - Dapatkan data dari `deliverables` state
- [x] Edit `app/admin/deliverables/page-client.tsx`
  - Replace card grid layout with `DeliverableDataTable`
  - Keep segmented filter pills (Status + Tipe) atas
  - Keep Add button
  - Keep empty state & loading state
- [x] Verify: `npx tsc --noEmit` → exit 0
- [x] Verify: `npx eslint` → 0 errors, 0 warnings
- [x] Verify: `npx next build` → compiled successfully
- [ ] E2E test: deliverables tab loads with DataTable

## Phase 5: Theme Toggle ✅

- [x] Copy `components/themes/theme-mode-toggle.tsx` (template: src/components/themes/theme-mode-toggle.tsx)
  - Adapt to Frhm `next-themes` (already in deps)
- [x] Add to `admin/layout.tsx` header (right side, before notification)
- [x] Verify: `npx tsc --noEmit` → exit 0
- [x] Verify: `npx eslint` → 0 errors, 0 warnings
- [x] Verify: `npx next build` → compiled successfully
- [x] Manual: dark mode toggle works

## Phase 6: Infobar (Sidebar Right Panel) ✅

- [x] Copy `components/ui/infobar.tsx` (template: src/components/ui/infobar.tsx)
  - Adapt `Icons` import → `lucide-react` (`ChevronsRight`)
  - Slim to subset: Provider, Infobar, InfobarTrigger, group/header/content primitives
- [x] Wrap entire `admin/layout.tsx` with `InfobarProvider`
- [x] Add `Infobar` with `side="right"` via `components/layout/info-sidebar.tsx` (sample help content)
- [x] Create sample content (help text for admin workspace)
- [x] Add `InfobarTrigger` button to header (right side, before avatar)
- [x] Verify: `npx tsc --noEmit` → exit 0
- [x] Verify: `npx eslint` → 0 errors, 0 warnings
- [x] Verify: `npx next build` → compiled successfully
- [x] Manual: `i` key toggles infobar (keyboard shortcut wired)

## Phase 6.1: Template Wiring (Breadcrumbs + Header Pattern) ✅

- [x] Copy `components/breadcrumbs.tsx` from template + `hooks/use-breadcrumbs.ts`
  - Adapt routeMapping to Frhm admin/client routes
- [x] Copy `components/layout/page-container.tsx` (template pattern: PageContainer + Heading)
- [x] Integrate Breadcrumbs into `header.tsx` (replace hardcode "Frhm Enterprise / Workspace")
- [x] Template header pattern: SidebarTrigger + separator + Breadcrumbs | Search + Theme + Infobar + Bell + UserNav
- [x] Verify: `npx tsc --noEmit` → exit 0
- [x] Verify: `npx eslint` → 0 errors, 0 warnings
- [x] Verify: `npx next build` → compiled successfully

## Phase 7: Notification (FRHM HAS BETTER IMPLEMENTATION)

**Note:** Frhm already has superior `NotificationBell` (spectrumui/notification-bell.tsx) with:
- Bell swing animation physics (SVG R1123)
- Ping halo animation
- Badge with count roll animation
- `dot` mode for minimal display

**Action:** Replace skeleton Bell in header with existing `NotificationBell`:
- [ ] Import `NotificationBell` from `components/spectrumui/notification-bell`
- [ ] Replace Bell icon with `<NotificationBell count={unreadCount} size="md" />`
- [ ] Style badge red dot variant
- [ ] Add `bell.tsx` animation keyframes (optional polish)

## Phase 8: Global CSS Additions (Tailwind v4 Utilities)

- [ ] Add `shimmer` utility to `globals.css` (template: lines 539-641)
  - `@property` CSS Houdini for shimmer animation
  - Utility classes: `shimmer`, `shimmer-once`, `shimmer-reverse`, `shimmer-none`
- [ ] Add `scroll-fade` utility to `globals.css` (template: lines 112-222)
  - Scroll-linked fade mask for ScrollArea
  - Variants: `scroll-fade`, `scroll-fade-y`, `scroll-fade-x`
- [ ] Add scrollbar styling (template: lines 22-46)
  - Thin, subtle scrollbar with hover color
  - Firefox + WebKit support
- [ ] Verify: `npx tsc --noEmit` → exit 0
- [ ] Verify: `npx eslint` → 0 errors, 0 warnings
- [ ] Verify: `npx next build` → compiled successfully

## Phase 9: Final Verification

- [ ] Run full `npx tsc --noEmit` → exit 0
- [ ] Run full `npx eslint` → 0 errors, 0 warnings
- [ ] Run full `npx next build` → compiled successfully
- [ ] Manual review:
  - Sidebar collapsible + groups
  - Header skip-link accessible
  - Workspace tabs 6 groups (not 15)
  - Deliverables table has filter + paginate
  - Dark mode toggle works
  - Infobar toggles with `i` key

## Phase 10: E2E Tests

- [ ] E2E test: admin shell loads with skip-link
- [ ] E2E test: workspace has exactly 6 tabs
- [ ] E2E test: deliverables table has pagination (count buttons)
- [ ] E2E test: dark mode toggle flips class on `html`
- [ ] E2E test: infobar opens/closes with keyboard