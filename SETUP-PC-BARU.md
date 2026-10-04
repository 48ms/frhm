# Setup di PC Baru — Frahma (Taraju Client Dashboard)

Checklist pindah mesin. Ditulis dari kondisi repo nyata per 2026-10-04.

> **Baca ini dulu:** project ini **belum punya git remote**. Kalau pindah hanya lewat
> `git clone`, kode tidak akan ikut. Pilih salah satu dari **Cara Pindah** di bawah.

---

## 0. Fakta lingkungan (samakan di PC baru)

| Item | Nilai |
|---|---|
| Node.js | **v22.x** (di mesin lama: v22.23.2) |
| npm | 12.x |
| Dev port | **3004** (jangan pakai 3001 — itu Bima CRM) |
| App utama | folder `app/` (Next.js App Router) |
| Database | Supabase **cloud** (project ref `tkwplrhkgfncprvezplk`) |
| Migrasi | 49 file di `app/supabase/migrations/` — **sudah live di produksi**, tidak perlu re-apply |

---

## 1. Pilih cara pindah

### ✅ Cara A — Git remote (SUDAH SIAP)
Repo: **`https://github.com/48ms/frhm`** (Private, branch `main`).
Di PC baru:
```bash
git clone https://github.com/48ms/frhm.git
cd "frhm"
```
Lanjut ke bagian **2**. Secret tetap harus dipindah manual (bagian 3).

### Cara B — Copy folder langsung (tanpa internet)
Copy seluruh folder `Tools Frahma`, tapi **kecualikan**:
- `app/node_modules/`
- `node_modules/`
- `app/.next/`

**Wajib ikut tercopy:** `app/.env.local` (kalau lewat git, file ini TIDAK ikut).

---

## 2. Install dependencies

```bash
# App Next.js
cd "Tools Frahma/app"
npm install

# Root (openspec + supabase CLI)
cd ..
npm install
```

---

## 3. Pulihkan secrets — `app/.env.local`

File ini **di-gitignore**, jadi tidak ikut git. Buat ulang dengan 13 variabel berikut
(template tersedia di `app/.env.example`). **Nilai diambil dari backup Anda** —
jangan pernah ditulis di dokumen ini.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3004
CRON_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_SECRET_TOKEN=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
TELEGRAM_ADMIN_CHAT_ID=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

> Catatan: nama key Supabase adalah `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
> (BUKAN `_ANON_KEY`).

---

## 4. Verifikasi sehat (semua harus hijau)

```bash
cd "Tools Frahma/app"

npx tsc --noEmit      # 0 error
npm test              # 147 passed (27 files)
npm run lint          # 0 error
npm run build         # Compiled successfully
```

Kalau `npm run build` bikin `.next` rusak untuk dev: `rm -rf .next` lalu restart.

---

## 5. Jalankan

```bash
cd "Tools Frahma/app"
npx next dev -p 3004
# buka http://localhost:3004  → redirect ke /auth/login
```

Login pakai akun admin (`dheia.buleud@gmail.com`) atau client yang ada di Supabase.

---

## 6. Kredensial yang TIDAK ada di repo (simpan di password manager)

| Item | Kegunaan |
|---|---|
| Isi `app/.env.local` (13 var) | Runtime app |
| Supabase **PAT** | Jalankan DDL via Management API: `POST /v1/projects/tkwplrhkgfncprvezplk/database/query` |
| Kredensial E2E (`AUDIT_E2E_EMAIL`, `AUDIT_E2E_PASSWORD`, dll) | Test Playwright login nyata |
| Kredensial Cloudinary | Upload Media Library (fitur fail-closed tanpa ini) |
| `WOOPSOCIAL_API_KEY` | Posting OAuth (fail-closed tanpa ini) |

---

## 7. Yang TIDAK perlu dilakukan

- ❌ Setup database — pakai Supabase cloud.
- ❌ Re-apply 49 migrasi — sudah live.
- ❌ Copy `node_modules` — install ulang lebih bersih.

---

## 8. Yang ikut otomatis lewat git

`openspec/`, `.agents/`, `.hermes/`, `.github/`, `.specify/`, `.impeccable/`,
`AGENTS.md`, `design.md`, `ROADMAP.md`, semua kode di `app/`, semua skill ECC.

---

## 9. Alur kerja setelah siap (konvensi project)

- **ECC default mutlak**: `plan → test → implement → review → verify → remember → improve`.
- Verifikasi wajib: `tsc --noEmit` + `eslint` + `next build` pass.
- Tenant isolation: query DB wajib lewat `client_id` (`current_user_client_id()`).
- Progress dicatat di `app/PROGRESS.md`.
