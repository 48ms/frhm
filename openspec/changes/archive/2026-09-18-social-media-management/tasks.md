# Tasks

## Phase 1: Database Foundation
- [x] Buat skema migrasi Supabase untuk tabel `campaigns`.
- [x] Buat skema migrasi Supabase untuk tabel `content_assets` (Hero Asset).
- [x] Buat skema migrasi Supabase untuk tabel `platform_posts` (Child Asset).
- `[x]` Tulis *types* TypeScript dari skema database baru di `src/types/database.ts` (ditulis di `app/lib/supabase/database.types.ts`).

## Phase 2: UI & State (Content Planning)
- [x] Buat halaman `/planning/new` untuk *Campaign Setup*.
- [x] Implementasikan UI *Pillar Allocation* dan *Funnel Stages*.
- [x] Tambahkan validasi Zod untuk memastikan batas distribusi pilar tidak dilanggar.

## Phase 3: UI & State (Structured Brief)
- [x] Buat komponen `ContentDraftForm` menggunakan `react-hook-form`.
- [x] Pecah form menjadi 3 bagian: *Visual Hook*, *Body*, dan *CTA*.
- [x] Implementasikan peringatan *real-time* (optimistic UI) dengan `animate-ui` jika ada *link* di platform LinkedIn.

## Phase 4: UI & State (Asset Repurposing Engine)
- [x] Buat tombol `Repurpose` di tampilan *Hero Asset*.
- [x] Implementasikan fungsi `handleRepurpose` untuk menghasilkan draf *Child Posts* secara otomatis.
- [x] Hubungkan UI draf *Child Posts* untuk menampilkan *preview* file dari *Hero Asset*.
