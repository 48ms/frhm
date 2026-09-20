# Mobile & Tablet Responsiveness

The UI is designed desktop-first, but a client approving deliverables on a phone is a normal case.
Two real defects were found and fixed; the audit below is what keeps them from coming back.

## Defects found and fixed

### 1. Workspace tab bar overflowed off-screen (severe)

`TabsList` uses `flex-1` triggers. With five tabs on a 390px screen the fifth tab rendered at
`x=400` — **outside the viewport and impossible to tap**. The Hasil tab, which is where skill
results land, was unreachable on any phone.

Fix: the tab bar scrolls horizontally on narrow screens and each trigger keeps a 44px target
(`workspace.tsx`). Labels use `whitespace-nowrap` + `shrink-0` so they neither wrap nor squash.

### 2. Sidebar stayed docked on tablets, overflowing the page (severe)

`SidebarProvider` defaults to `defaultOpen = true`, and `useIsMobile` used a 768px breakpoint,
so at exactly 768px (iPad portrait) the 256px rail stayed docked next to content and the page
overflowed by **249px**.

Fix: `hooks/use-mobile.ts` raises the breakpoint to **1024px** (`lg`), matching Tailwind. Below
that the sidebar behaves as an overlay sheet and content gets the full width.

### 3. Touch targets below the 44px minimum (medium)

The installed size scale (`h-6`/`h-7`/`h-8`) is tuned for mouse precision. On phones this left
106 skill-status selects, the stage collapsibles, the `.md` file chips and the header buttons
between 24px and 32px.

Fix: one rule in `globals.css` gated on `@media (pointer: coarse)` — it raises every
`[data-slot="button"]`, select trigger, input and `[role="tab"]` to `2.75rem`. **Desktop is
untouched**: density there is intentional and a mouse does not need 44px rows.

## Rule for new UI

Raise touch targets with **`h-11 lg:h-*`**, never `sm:`. `sm` is 640px — a phone in landscape and
a tablet in portrait are both wider than that and are both touch devices. Only `lg` (1024px+,
pointer: fine) should restore the denser desktop sizing.

## Verified (Playwright, computed geometry)

| Viewport | Admin pages | Client pages | H-overflow |
|---|---|---|---|
| 390px iPhone | 0 elements < 40px | 0 | 0px |
| 768px iPad | 0 elements < 40px | 0 | 0px |
| 1280px desktop | dense by design | dense by design | 0px |

Audited pages: dashboard, audit log, clients list, deliverables, client workspace (all five
tabs), and client dashboard / deliverables / pipeline.
