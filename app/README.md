# Frhm - Digital Marketing Client Dashboard

Platform SaaS untuk manajemen deliverable (konten, laporan, brief) antara Social Media Specialist dan Client.

## Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn Base UI (nova preset) + Motion (Animate UI)
- **Database & Auth:** Supabase (PostgreSQL)

## Role & Akses
Aplikasi memiliki 3 lapis hak akses (diatur via Supabase Auth + RLS + Middleware):
1. **Admin** (`role: 'admin'`)
   - Bisa mengakses `/admin/*`.
   - RLS: Bisa read/write semua data `clients`, `deliverables`, `comments`, dll.
   - Manajemen semua klien, approval, kalender konten.
2. **Client** (`role: 'client'`)
   - Bisa mengakses `/client/*`.
   - RLS: Hanya bisa read/write data yang terhubung ke `client_id` miliknya.
   - Meminta revisi atau memberikan approval (Disetujui).
3. **Waitlist / Unassigned** (`role: null`)
   - Otomatis dialihkan ke `/waitlist`.
   - Akun Google terverifikasi, tapi admin belum meng-assign `role` dan `client_id` di tabel `users`.

## Skema Database Utama
- `users`: Extend data auth. Menyimpan `role` ('admin' | 'client') dan `client_id` (jika role = client).
- `clients`: Data brand klien (nama, status, created_at).
- `deliverables`: Inti aplikasi. Menyimpan draft/pekerjaan yang akan di-review klien.
  - Relasi ke `client_id`.
  - Status: `draft` -> `sent` -> `revision_requested` | `approved`.
- `comments`: Diskusi dua arah per `deliverable_id`. Menyimpan `user_id` pengirim.
- `status_history`: Log otomatis setiap kali status deliverable berubah (Trigger on Update).

## Testing & Audit
- Playwright E2E testing menguji route guards, login, dan skeleton UI (`e2e/`, 58 spec files).
- Unit tests via Vitest + React Testing Library (`components/**/*.test.tsx`, `features/**/*.test.tsx`).
- Styling strict mengikuti standar **antislop-ui** (radius seragam `rounded-xl`, shadow sebagai elevasi (bukan border glow), hapus rainbow badges, no copy-paste cards).

## Deployment
1. Deploy Next.js app ke Vercel (Production/Preview).
2. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Setup Google OAuth Credentials di console.cloud.google.com, assign Client ID & Secret ke Supabase Auth provider.
