# Implementation Plan: Taraju Client Dashboard MVP

**Branch**: `001-taraju-client-dashboard` | **Date**: 2026-09-13 | **Spec**: specs/001-taraju-client-dashboard/spec.md

**Input**: Feature specification from `/specs/001-taraju-client-dashboard/spec.md`

## Summary

Bangun web dashboard dua peran (admin/client): Bima sebagai admin membuat dan mengelola deliverable (brief, draft konten, laporan) untuk Taraju; client bisa melihat, approve/minta revisi, dan berkomentar — menggantikan alur feedback manual lewat WhatsApp/email yang gampang kececer.

## Technical Context

**Language/Version**: TypeScript, Next.js 14 (App Router)

**Primary Dependencies**: Next.js, Tailwind CSS, Supabase JS client, Supabase Auth (Google OAuth provider)

**Storage**: Supabase Postgres (data). Supabase Storage TIDAK dipakai di MVP — lampiran gambar/file cukup lewat link eksternal (lihat spec.md FR-012).

**Testing**: [NEEDS CLARIFICATION: belum diputuskan — kemungkinan QA manual untuk MVP, Playwright/Vitest opsional untuk fase lanjut]

**Target Platform**: Web (desktop + mobile browser), deploy di Vercel

**Project Type**: web-service (Next.js App Router merangkap frontend + API route ringan, backend utama Supabase — tidak ada server custom terpisah)

**Performance Goals**: Tidak kritikal di skala 1 client; target kasar <2 detik load per halaman

**Constraints**: UI client harus minim friksi teknis; Row Level Security wajib diterapkan sejak awal meski baru 1 client, biar gak perlu retrofit pas nambah client kedua

**Scale/Scope**: 1 client (Taraju) untuk MVP, estimasi 5-15 deliverable/bulan, 2 peran user (admin, client)

## Constitution Check

*GATE: Harus lolos sebelum Phase 0 research. Re-check setelah Phase 1 design.*

- **Admin-Controlled, Client-Restricted** → Ditegakkan lewat Supabase Row Level Security (RLS) berdasarkan role + client_id, bukan cuma disembunyikan di UI. **PASS**
- **Single Source of Truth** → Semua deliverable & komentar hidup di Supabase, tidak ada salinan di WA/email dianggap "resmi". **PASS**
- **Simple Over Scalable** → Scope MVP dikunci ke Taraju saja, tidak ada UI multi-client. **PASS**
- **Transparent Feedback Loop** → Riwayat status & komentar disimpan dengan timestamp, tidak ada hard-delete. **PASS**
- **Low-Friction Client Experience** → Login pakai Google OAuth (Supabase Auth) — client tidak perlu bikin password baru, cukup akun Google yang sudah mereka punya. Role & client_id diatur manual oleh admin di database, bukan saat signup. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/001-taraju-client-dashboard/
├── plan.md              # File ini
├── spec.md              # Feature specification
├── constitution.md      # Prinsip project
├── tasks.md             # Daftar task implementasi
└── contracts/           # (kosong untuk MVP — tidak ada API eksternal di luar Supabase)
```

### Source Code (repository root)

```text
app/
├── admin/
│   ├── login/
│   ├── dashboard/                 # Daftar semua deliverable, filter status/type
│   └── deliverables/
│       ├── new/                   # Form bikin deliverable baru
│       └── [id]/                  # Edit + lihat komentar + balas
├── client/
│   ├── login/
│   ├── dashboard/                 # Daftar deliverable milik client ini
│   └── deliverables/
│       └── [id]/                  # Detail + Approve/Minta Revisi + komentar
lib/
├── supabase/                      # Client init, generated types
└── auth/                          # Helper cek role & client_id
components/
├── ui/                            # Button, badge status, dll
└── deliverable/                   # Card, status badge, comment thread
supabase/
└── migrations/                    # Schema: clients, deliverables, comments, users
```

**Structure Decision**: Satu project Next.js (App Router) dengan route terpisah `admin/` dan `client/`, backend langsung ke Supabase — tidak ada backend service terpisah untuk MVP. Ini paling sesuai skala (1 client, 2 peran) dan konsisten dengan prinsip Simple Over Scalable.

## Complexity Tracking

*Tidak ada pelanggaran constitution yang perlu dijustifikasi pada tahap ini.*
