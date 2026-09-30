# Proposal: Client Foundation Setup — Gerbang Konfigurasi

## Why

`app/app/admin/clients/[id]/workspace.tsx` punya tab **Setup** yang merender `<ClientSetup />`. `setup.tsx` (41 baris) menerima 8 props lengkap dari `page.tsx` tapi **tidak dipakai sama sekali** — cuma render dialog edit brand-profile, tombol "Generate Foundation", dan kosong.

Data sudah di-query: 13 tabel Supabase, 7 pipeline stage, 106 skills, 8 guardrail rules, brand profile content. Tinggal dirender dan difungsionalisasi.

**Pain yang diselesaikan:**
1. Planning manual → Setup nyalain stage Plan, view = Calendar (tab lain)
2. Produksi chaos → Setup nentuin skill Create/Media, tracking = Production (tab lain)
3. Lupa posting → Setup cek channel, reminder = Calendar (tab lain)
4. Evaluasi lemah → Setup nyalain Measure (infrastruktur, nanti)

**Artinya:** Setup bukan kalender, bukan production board, bukan analytics. Setup = gerbang. Tanpa gerbang terbuka, tab lain tidak bisa kerja dengan benar.

## What Changes

### Fase 1 — Render data yang sudah ada (no new API)
- Checklist 5 file fondasi + status per file (`ada` / `butuh sampel` / `ikut batch`)
- 7 pipeline stages + progress per stage dari `client_skills`
- Channels + status bridge (`belum` / `terhubung` / `gagal`)
- Provider default dari `ai_providers`
- Guardrails & ground truths (accordion verbatim dari AGENTS.md)

### Fase 2 — Orkestrator batch generation
- API endpoint `/api/client/foundation/batch` yang loop 3 skill (audience → social-strategy → content-pillars)
- Guard: `brand-profile.md` wajib ada dulu
- Save ke `client_files` per skill via `run_skill.py`
- UI: tombol "Generate 3 file fondasi" di card file fondasi
- UX: loading state per file, stop-on-failure

### Fase 3 — Voice builder UI (pisah dari batch)
- Dialog textarea paste 3-5 sampel tulisan
- Call `voice-builder` skill setelah sampel masuk
- Save `voice.md`
- Catatan: voice tidak boleh di-generate dari brand-profile saja (aturan repo: `don't invent a voice`)

### Fase 4 — Integrasi dengan tab lain (nanti)
- File fondasi jadi input untuk Calendar, Production, Analytics tabs
- Reminder berdasarkan pipeline stage + skill status

## Scope

**In Scope:**
- `app/app/admin/clients/[id]/setup.tsx` — render semua data props
- `app/app/api/client/foundation/batch/route.ts` — orkestrator batch
- `scripts/run_skill.py` — sudah ada, cukup di-call dari API
- Mockup: `app/dogfood-output/client-setup-form.html` — sudah jadi, jadi referensi visual

**Out of Scope:**
- Kalender UI (tab lain)
- Production board (tab lain)
- Reminder system (fase 4, nanti)
- Analytics ↔ sales linkage (spesifikasi terpisah)
- E2E test untuk batch generation (berikan di change terpisah)

## Impact

**Dependencies:**
- `client-workspace-coverage` change selesai (E2E foundation routes tested)
- `observability-audit-trail` change aktif (audit logging tersedia)
- `ai_pipeline_stages` table: 7 rows sudah ada
- `skills` table: 106 rows sudah ada
- `client_files` table: sudah ada, tinggal insert/update

**Code Touchpoints:**
- `app/app/admin/clients/[id]/setup.tsx` — rewrite dari 41 baris kosong → full gerbang
- `app/app/admin/clients/[id]/page.tsx` — tidak perlu ubah (data sudah di-query)
- `app/app/api/client/foundation/batch/route.ts` — new route
- `scripts/run_skill.py` — sudah ada, pakai langsung
- `app/components/ui/` — Card, Label, Badge sudah tersedia (dari Base UI)

**Risk:**
- `run_skill.py` hardcode client id. Perlu jadi dynamic parameter.
- Chain execution: jika skill pertama gagal, jangan lanjut skill kedua/ketiga.
- Voice generation vs real samples: jangan otomatis generate tanpa input manusia.

**Non-Goals (Explicit):**
- Full workflow automation (kalender otomatis, reminder otomatis)
- AI-generated voice dari brand-profile (melanggar aturan repo)
- Publish/schedule otomatis tanpa konfirmasi
- Analytics dashboard (tab lain)
