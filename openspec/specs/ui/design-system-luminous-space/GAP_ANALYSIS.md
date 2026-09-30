# Design System Alignment: Luminous Space (Stitch) vs Current Frahma SaaS

## Status Saat Ini
Project saat ini berada pada tahap `foundation-setup` (Next.js 14, Tailwind v4, shadcn preset Nova). Belum ada visual parity dengan referensi Stitch (`_stitch-admin/`).

## Gap Identifikasi
1. **Color Palette (Warna):** Penggunaan default neutral/zinc shadcn. Stitch memerlukan sistem 30+ token warna "Luminous Space" (Background: `#fbf8ff`, Primary: `#526600`, Primary Container: `#d4ff32`).
2. **Typography (Font):** Stitch memerlukan font pairing spesifik: `Syne` (Display Hero) dan `Geist` (Body/Interface).
3. **Component Styling:** Shadcn komponen (card, button, input) saat ini belum menerapkan efek glassmorphism dan token spacing ketat yang ada di Stitch.
4. **Layout Structure:** Struktur sidebar (collapsible), header (floating), dan content grid belum mengacu pada arsitektur `_stitch-admin/code.html`.
5. **Interaction/UI Logic:** Chart (sparklines) dan progress bars belum memiliki kustomisasi visual sesuai standar Stitch.

## Tahapan Kerja (Phased Execution)

### Fase 1: Visual Foundation (Low-hanging fruit)
- [ ] Override `tailwind.config.ts` dengan palet warna `Luminous Space`.
- [ ] Registrasi font `Syne` dan `Geist` via `next/font`.
- [ ] Update globals.css dengan variabel design tokens.

### Fase 2: Component Refactor
- [ ] Modifikasi komponen shadcn (Button, Card, Input) untuk menyerap token `border-radius`, `shadow`, dan `hover-states` versi Stitch.
- [ ] Implementasi sistem spacing 4px/8px grid.

### Fase 3: Layout & Architectural Alignment
- [ ] Implementasi `layout.tsx` (sidebar, header) meniru `_stitch-admin/code.html`.
- [ ] Refactor container konten utama.

### Fase 4: Interaction Upgrade
- [ ] Implementasi kustomisasi chart (Recharts) dengan styling glassmorphism.
- [ ] Penyelarasan visual progress bars dan status indicators.

## Catatan Tambahan
- Pendekatan dilakukan secara "1 persatu" (methodical).
- Pastikan setiap perubahan diverifikasi dengan screenshot (light + dark mode) dibandingkan dengan `_stitch-admin/screen.png`.
