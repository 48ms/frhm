# Tasks: Brand Profile Editor

## Phase 1: Markdown Parser & Serializer Utility
- [x] 1.1 Buat utility `app/lib/onboarding/brand-profile-parser.ts` untuk parse markdown ke structured object dan serialize kembali ke markdown string
- [x] 1.2 Tambahkan unit test / verifikasi parsing terhadap output template default

## Phase 2: API Route untuk Update File Client
- [x] 2.1 Buat endpoint `app/app/api/admin/clients/[id]/files/route.ts` (PUT / POST) untuk menyimpan/mengupdate file client (`brand-profile.md`) ke tabel `client_files` dengan RLS & audit log

## Phase 3: Komponen BrandProfileEditor UI
- [x] 3.1 Buat komponen `app/components/client/brand-profile-editor.tsx` menggunakan Dialog shadcn
- [x] 3.2 Implementasikan form tabs/sections: Identity, Audience, Content Pillars (dengan live validation total 100%), dan Guardrails
- [x] 3.3 Hubungkan save action ke API dan emit event/callback refresh

## Phase 4: Integrasi ke Workspace Client
- [x] 4.1 Tambahkan tombol "Edit Brand Profile" di tab Foundation pada halaman `app/app/admin/clients/[id]/page.tsx`
- [x] 4.2 Verifikasi build Next.js (`npx tsc --noEmit`) dan tes interaksi flow