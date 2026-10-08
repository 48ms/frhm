# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 14+ (App Router), TypeScript, Tailwind CSS v4, shadcn Base UI (nova), Supabase (PostgreSQL + RLS)

## Users

**Primary:** Digital Marketing Agency Admins (Bima & team).
**Job:** Mengelola operasional multi-klien (konten, laporan, budget, KOL) dengan kecepatan tinggi.

## Product Purpose

Frhm adalah Marketing ERP (Enterprise Resource Planning) agensi yang mengotomasi operasional agensi. Sukses berarti **Admin dapat menyelesaikan pekerjaan klien lebih cepat** (kecepatan operasional agensi).

## Positioning

ERP agensi dengan isolasi data klien yang kuat (multi-tenant) dan *state-sync* URL (`nuqs`) yang membuat navigasi admin super cepat.

## Operating Context

- Agensi mengelola banyak klien sekaligus (Taraju, Pawon Sengon, dll).
- Workflow: Penjadwalan konten → Approval klien → Pelaporan & Budgeting.
- Alat utama: Kanban, Kalender, Dashboard ERP, Tracking Budgeting.

## Capabilities and Constraints

- **Multi-agency B2B SaaS**: Arsitektur mendukung *multiple agencies*, tiap agensi memiliki daftar klien sendiri (multi-tenant isolation).
- **Security**: 100% Supabase Auth + RLS.
- **Performance**: Waterfall data-fetching dihindari (parallel prefetcher).

## Brand Commitments

- **Identitas**: Aksen warna diambil dari logo klien, tidak pakai warna *default library*.
- **UX**: Keyboard-centric, data density tinggi untuk admin.
- **Accessibility**: WCAG 2.1 AA (standar minimum).

## Evidence on Hand

- `TODO.md` (dashboard data migration)
- `AGENTS.md` (standard & aturan pengembangan)
- `design.md` (filosofi UI/UX)

## Product Principles

1. **Agensi-Speed First**: UI dioptimalkan untuk kecepatan penyelesaian tugas admin.
2. **Hard Isolation**: Data klien agensi A tidak pernah boleh terlihat oleh agensi B.
3. **Faktual & Transparan**: Metrik dan budget diambil langsung dari DB, dilarang mock data.
4. **UX Premium (Animate UI)**: Fluid, spring-physics, premium feel.

## Accessibility & Inclusion

WCAG 2.1 AA (Wajib minimum).
