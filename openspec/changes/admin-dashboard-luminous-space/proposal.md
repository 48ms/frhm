## Why

Admin dashboard masih terpecah: shell sudah pakai Luminous Space tapi halaman-halamannya (dashboard, clients, deliverables, analytics, settings, dll.) masih pakai styling generik. User tidak mendapatkan pengalaman "Luminous Space" yang utuh — warna, komponen, dan motion tidak konsisten.

## What Changes

- **Visual overhaul penuh**: semua 31 halaman admin (`/admin/*`) di-restyle ke Luminous Space. Struktur data & navigasi tidak berubah, hanya penampakan.
- **Navigation pills capsule**: sidebar menggunakan rounded pills (lime aktif, cobalt CTA), brand capsule di header, floating action button.
- **Dashboard redesign**: hero "Good day, Creator.", 4 KPI cards dengan progress/sparkline, analytics chart glass panel, content queue dengan thumbnail cards.
- **Glassmorphism system**: fluted glass overlay, mesh gradient background, floating pills, soft shadows.
- **Icon registry**: tetap pakai `@/components/icons` (Tabler) bukan Material Symbols.

## Capabilities

### New Capabilities

- `ui/admin-luminous-space`: Full admin UI redesign ke Luminous Space visual system. Cakupan:
  - Sidebar capsule navigation + brand pill
  - Topbar glass with search + CTAs
  - KPI cards dengan progress/sparkline
  - Analytics chart glass panels
  - Content queue cards with thumbnails
  - Floating pills & badges
  - Full-screen mesh gradient background

### Modified Capabilities

- `ui/design-system-standards`: Tambah requirement "Admin Visual System" — semua `/admin/*` halaman wajib pakai Luminous Space: primary-container (#D4FF32) untuk active states, secondary-container (#4353FF) untuk CTAs, fluted-glass overlay untuk glass surfaces, mesh gradient background.

## Impact

- **Code**:
  - `app/app/admin/layout.tsx`, `header.tsx` — wrapper theme, mesh background
  - `components/app-sidebar.tsx`, `nav-main.tsx` — pills, brand capsule
  - `app/app/admin/dashboard/` — hero, KPI bento, analytics chart, content queue
  - `app/app/admin/clients/`, `deliverables/`, `analytics/`, `settings/` — cards, buttons, badges Luminous Space
- **CSS**:
  - `app/app/admin/admin-stage.css` — token extend, glass utilities, mesh gradient
- **Data**: TIDAK ADA perubahan skema atau API
- **Kompatibilitas**: 100% non-breaking, hanya visual. Supabase Auth/RLS tetap 100% sesuai rule AGENTS.md
