---
description: "Task list untuk Taraju Client Dashboard MVP"
---

# Tasks: Taraju Client Dashboard MVP

**Input**: Design documents dari `/specs/001-taraju-client-dashboard/`

**Prerequisites**: plan.md, spec.md, constitution.md

**Tests**: Tidak diminta eksplisit di spec — tidak ada task test formal untuk MVP, QA dilakukan manual per checkpoint.

**Organization**: Task dikelompokkan per user story biar tiap story bisa diimplementasi & dites independen.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Bisa dikerjakan paralel (file berbeda, tanpa dependensi)
- **[Story]**: User story terkait (US1, US2, US3, US4)

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Init project Next.js 14 + TypeScript + Tailwind
- [ ] T002 Buat project Supabase, simpan env vars (URL, anon key, service key)
- [ ] T003 [P] Setup ESLint + Prettier
- [ ] T003b Setup Animate UI (copy komponen dasar via CLI shadcn-style: Button, Card, Badge + versi animasi Lucide icon), restyle token warna/font sesuai design.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: Tidak ada user story yang boleh mulai sebelum phase ini selesai

- [ ] T004 Desain & terapkan schema Supabase: `clients`, `deliverables`, `comments`, `users` (lihat data model di spec awal project)
- [ ] T005 [P] Aktifkan Supabase Auth dengan provider Google OAuth; siapkan proses manual assign role (`admin`/`client`) + `client_id` di tabel `users` setelah akun Google pertama kali login (akun tanpa role tidak boleh bisa akses apa pun)
- [ ] T006 [P] Terapkan Row Level Security: client hanya bisa akses baris dengan `client_id` miliknya; admin akses semua
- [ ] T007 Generate TypeScript types dari schema Supabase
- [ ] T008 Bangun layout dasar + route guard berbasis role (`admin/` vs `client/`)
- [ ] T009 Setup konfigurasi environment (.env.local, .env production)

**Checkpoint**: Fondasi siap — user story implementation bisa mulai

---

## Phase 3: User Story 1 - Admin membuat & mengirim deliverable (P1) 🎯 MVP

**Goal**: Admin bisa bikin deliverable dan mengirimkannya ke client

**Independent Test**: Admin bikin deliverable baru, ubah status ke "terkirim", muncul di daftar dengan status benar

### Implementation

- [ ] T010 [P] [US1] Buat form deliverable baru di `app/admin/deliverables/new` (field: tipe, judul, isi teks/markdown, 1 link eksternal opsional — bukan upload file)
- [ ] T011 [US1] Implementasi create-deliverable ke Supabase (depends on T010)
- [ ] T012 [US1] Buat halaman detail/edit deliverable admin di `app/admin/deliverables/[id]`
- [ ] T013 [US1] Tambah kontrol perubahan status draft → terkirim
- [ ] T014 [US1] Tambah validasi & error handling form deliverable
- [ ] T014b [US1] Implementasi reset status otomatis ke "draft" saat admin mengedit deliverable yang berstatus "approved"
- [ ] T014c [US1] Implementasi aksi hapus deliverable, dibatasi hanya untuk status "draft" (tombol hapus disembunyikan/nonaktif untuk status lain)

**Checkpoint**: Admin bisa bikin dan kirim deliverable secara end-to-end

---

## Phase 4: User Story 2 - Client approve / minta revisi (P1) 🎯 MVP

**Goal**: Client bisa lihat deliverable dan ambil keputusan approve/revisi

**Independent Test**: Deliverable berstatus "terkirim" bisa di-approve atau diminta revisi oleh client, status berubah sesuai

### Implementation

- [ ] T015 [P] [US2] Buat halaman daftar deliverable client di `app/client/dashboard`
- [ ] T016 [US2] Buat halaman detail deliverable client di `app/client/deliverables/[id]`
- [ ] T017 [US2] Implementasi aksi "Disetujui" (status → approved)
- [ ] T018 [US2] Implementasi aksi "Minta Revisi" (status → revision_requested)
- [ ] T019 [US2] Pastikan query client dibatasi ke `client_id` miliknya sendiri (verifikasi RLS jalan)

**Checkpoint**: Loop inti (admin kirim → client putuskan) sudah lengkap — ini MVP yang bisa dipakai

---

## Phase 5: User Story 3 - Komentar dua arah (P2)

**Goal**: Admin dan client bisa saling komentar di satu deliverable

**Independent Test**: Client tulis komentar, admin balas, keduanya muncul berurutan di thread yang sama

### Implementation

- [ ] T020 [P] [US3] Buat komponen thread komentar
- [ ] T021 [US3] Implementasi aksi tambah komentar untuk kedua role
- [ ] T022 [US3] Tampilkan badge jumlah komentar di daftar deliverable

**Checkpoint**: Feedback dua arah jalan di kedua sisi

---

## Phase 6: User Story 4 - Dashboard overview & filter admin (P3)

**Goal**: Admin bisa pantau semua deliverable dari satu tempat, difilter status/tipe

**Independent Test**: Dengan beberapa deliverable status berbeda, filter status tertentu hanya menampilkan yang sesuai

### Implementation

- [ ] T023 [P] [US4] Bangun tampilan daftar semua deliverable di dashboard admin
- [ ] T024 [US4] Tambah filter berdasarkan status
- [ ] T025 [US4] Tambah filter berdasarkan tipe
- [ ] T026 [US4] Tambah badge/indikator visual status

**Checkpoint**: Admin gak perlu buka satu-satu buat tau mana yang butuh tindakan

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T027 [P] Polish UI/UX, pastikan tampilan client mobile-friendly
- [ ] T028 Deploy ke Vercel, sambungkan ke Supabase production
- [ ] T029 Buat akun client Pak Adit, kirim instruksi login
- [ ] T030 [P] Tulis README singkat soal skema & role buat referensi diri sendiri nanti

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Tanpa dependensi
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS semua user story
- **US1 & US2 (Phase 3-4, keduanya P1)**: Bisa jalan setelah Foundational; US2 butuh minimal 1 deliverable dari US1 untuk dites, tapi kodenya independen
- **US3 (Phase 5)**: Bisa mulai setelah Foundational, tapi baru terasa gunanya setelah US1 & US2 ada
- **US4 (Phase 6)**: Bisa mulai kapan saja setelah Foundational, paling berguna setelah ada beberapa deliverable dari US1
- **Polish (Phase 7)**: Setelah semua story prioritas yang diinginkan selesai

## Implementation Strategy

### MVP First
1. Phase 1: Setup
2. Phase 2: Foundational (CRITICAL — blocking)
3. Phase 3: US1
4. Phase 4: US2
5. **STOP & VALIDASI**: Coba end-to-end sebagai admin dan client — ini sudah MVP yang bisa dipakai gantiin WA
6. Lanjut Phase 5-7 kalau mau nambah komentar & polish

## Notes

- [P] = file berbeda, tanpa dependensi, bisa dikerjakan bersamaan
- Verifikasi RLS (T006, T019) adalah titik paling kritis untuk keamanan data antar client — jangan skip meski baru 1 client
- Checkpoint di akhir Phase 4 adalah versi paling minimal yang sudah "layak pakai"
