# Design

## Design Read

**Page kind:** Admin dashboard (Frhm)  
**Audience:** Marketing operations team  
**Visual language:** Clean, professional, enterprise SaaS  
**ENERGY:** 2 (structured, not noisy)  
**RHYTHM:** 2 (consistent, predictable)  
**MOTION:** 1 (hover states only)

---

## Shell Architecture

### Sidebar

- Collapsible with `SidebarRail` (like template `app-sidebar.tsx`)
- Groups: OVERVIEW, OPERATIONS, CLIENTS, AI CORE, SYSTEM
- Mobile: collapsible drawer, not bottom bar
- Active state: `brand-accent/10` bg + border (like current Frhm)

### Header (admin layout)

- Fixed top, `h-14`, `backdrop-blur-xl`
- Skip-link (accessibility): `Skip to content` (visually hidden, visible on focus)
- Left: `SidebarTrigger` + separator + title (`Frhm Enterprise / Workspace`)
- Right: `KBar` search (`Cmd+K`), notification bell (with badge), user avatar dropdown

### Workspace (client detail)

- Consolidate **15 tabs → 5 groups**:
  - **Setup** → Setup, Skills, Pipeline
  - **Production** → Production, Calendar, Events, Brand Assets
  - **Marketing** → Budget, Ads, ROI
  - **Insight** → Analytics, Feedback, Radar Tren
  - **Output** → Deliverables, Hasil
- Use `Tabs` component with `role="tablist"` for accessibility
- Mobile: scroll horizontal (like current), but with fewer tabs

---

## Data Components

### DataTable

- Wrap with `DataTable` component (`src/components/ui/table/data-table.tsx` pattern)
- Features:
  - Sticky header
  - Horizontal scroll with `ScrollArea`
  - Column selection / pinning (optional)
  - Empty state: "No results" with help text

### DataTableToolbar

- Search input (text filter)
- Column filters (faceted, date range, number range, text, multi-select)
- Reset filters button (when active)
- View options (show/hide columns)

### Pagination

- Rows per page selector (10, 20, 30, 40, 50)
- Page X of Y text
- First/Prev/Next/Last buttons
- Selection count (if row selection enabled)

### Skeleton

- Use `Skeleton` component for loading states
- Text skeletons: `h-4 w-full`, `h-6 w-48`
- Card skeletons: `h-64 rounded-lg bg-muted`
- Row skeletons: `h-12 flex gap-2`

---

## Info Panel

### InfobarProvider

- Right-side collapsible panel (`w-22rem`)
- Keyboard: `i` (or `Cmd+i`) to toggle
- Auto-close when pathname changes
- Content: page-specific help, links, instructions

---

## Theme

### Dark Mode

- Use `next-themes` (already in deps)
- Toggle: `theme-mode-toggle.tsx` pattern
- Theme transition: `disableTransitionOnChange`
- System preference: `enableSystem`

### Color Tokens

- Frhm already has: `brand-accent`, `background`, `card`, `muted`, `border`
- Template has: `sidebar` token (already in Frhm `globals.css`)
- No migration needed, just adopt consistent naming

---

## Accessibility

### Skip to content

- Link at top of layout (`skip-link.tsx` pattern)
- Hidden until focused
- Target: `#main-content` in `SidebarInset`

### ARIA

- Tabs: `role="tablist"`, `role="tab"`, `role="tabpanel"` (Base UI does this automatically)
- Buttons: `aria-label` for icon-only buttons
- Forms: `aria-describedby` for error messages

### Focus

- Visible focus ring: `ring-2` + `ring-ring`
- Outline: `outline-hidden` + focus-visible ring (shadcn pattern)

---

## Animation

### ScrollFade (optional)

- Use `scroll-fade` utility from template `globals.css`
- Only on: main content scroll, card reveal
- Respect `prefers-reduced-motion`

### Shimmer (optional)

- Use `shimmer` utility from template `globals.css`
- Only on: loading skeletons, empty states

---

## Implementation Steps (1 per satu)

1. **Replace shell** → `app-sidebar.tsx` + `admin/layout.tsx` → template patterns
2. **Consolidate workspace** → 15 tabs → 5 groups in `workspace.tsx`
3. **Add DataTable pattern** → `data-table.tsx`, `data-table-toolbar.tsx`, `data-table-pagination.tsx`
4. **Integrate to deliverables** → Replace static table in `deliverables` tab with DataTable
5. **Add theme toggle** → `theme-mode-toggle.tsx` to header
6. **Add infobar** → `InfobarProvider` to `admin/layout.tsx`
7. **Add notification** → `NotificationCenter` to header (placeholder for now)
8. **Add skeleton** → Loading states for all async components
9. **Add skip-link** → `skip-link.tsx` to `admin/layout.tsx`
10. **Verify** → `tsc`, `eslint`, `npm run build` → manual review
