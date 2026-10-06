# Frhm — Digital Marketing Platform

> Product: **Frhm** (SaaS milik Bima Maulana Saputra)
> Client brands: Taraju (Pak Adit), Pawon Sengon (Bunda)

Lihat aturan lengkap di file root: [AGENTS.md](file:///c:/Users/bimam/Downloads/Tools%20Frahma/AGENTS.md).
Semua pengembangan wajib mematuhi standar arsitektur `next-shadcn-dashboard-starter` dan kedaulatan 100% Supabase Auth + PostgreSQL RLS.

## Aturan wajib (ringkas, lengkap di root AGENTS.md)
- **URL state = `nuqs` (MUTLAK).** Setiap filter/tab/pencarian/sorting/paginasi/ID seleksi disimpan di URL via `nuqs` (https://github.com/47ng/nuqs). `NuqsAdapter` wajib ada di `app/layout.tsx`. Server pakai `createSearchParamsCache`, client pakai `useQueryStates({ shallow: true })`. Dilarang `useState` lokal untuk filter atau menulis search params manual.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- People: `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
Mode antislop diaplikasikan: **during the work** (selama pengerjaan berlangsung).
<!-- antislop:end -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
