## Context

Lihat `proposal.md` — Why. Referensi visual: `_stitch-admin/code.html` (dashboard penuh) + `_stitch-admin/DESIGN.md` (sistem desain Luminous Space, identik dengan referensi login). Lihat `specs/ui/admin-luminous-space/spec.md` dan `specs/ui/design-system-standards/spec.md` untuk kontrak perilaku.

Kondisi saat ini (hasil audit):

- 79 file `.tsx` di `app/app/admin`. Hanya **1** yang sudah memakai kelas Luminous Space (`dashboard/page.tsx`). 78 sisanya masih gaya generik.
- Shell sudah setengah jalan: `app/app/admin/layout.tsx` (`.admin-theme` + `.admin-viewport` + orbs), `header.tsx` (`.admin-header`), `app-sidebar.tsx` (wordmark lime dot), `admin-stage.css` (token + glass + fluted + chip).
- Referensi memakai **Material Symbols Outlined** (26 nama ikon). Aturan `AGENTS.md` #5 melarang import ikon langsung di feature component.
- Referensi `code.html` punya duplikasi berat (`tailwind.config` x2, `<title>` x2, `<style>` x2) — ini artefak ekspor, bukan acuan kode.

### Reference Module Inventory (audit lengkap `code.html`, 864 baris)

Urutan modul dari atas ke bawah — ini daftar lengkap yang harus ditiru:

**Sidebar** (`aside`, fixed w-64, `hidden md:block`): brand capsule (lingkaran cobalt + SVG FRHM lime/putih/cobalt, "FRHM" Syne + "Campaign Hub") → nav pill (Overview **aktif lime**, Social Accounts, Campaigns, Content Calendar, Analytics, Client) → CTA "New Post" cobalt → footer (Settings, Support) → user pill ("Amara Vance / Design Lead", avatar `ring-2 ring-primary-container`).

**Header** (sticky h-16): brand span **kosong** + pill "STUDIO" (lime) → search (w-72, rounded-full, hidden sm:block) → "Quick Export" (hidden lg:flex) → "Create Campaign" (lime, hover glow) → notifikasi (dot cobalt) → apps → avatar.

**Main** (`p-6 lg:p-8 space-y-8 max-w-[1440px]`):
1. **Welcome Hero** — "Good day, Creator." + pill kosong + `<p>` kosong; deco capsule cobalt/lime blur + "✦"; tombol "Export Report" / "Schedule Post".
2. **KPI Grid** (4 kartu) — TOTAL REACH (1.4M, +14.2%, bar 78% cobalt) · SCHEDULED QUEUE (28 Posts, pill IG:12/TT:9/YT:4/LI:3) · AVG. ENGAGEMENT (5.8%, +0.9%, sparkline 6 bar) · ACTIVE CAMPAIGNS (8 Live, bar 100% lime).
3. **Bento kiri (8 col)**:
   - **Analytics card** — "AUDIENCE TRAJECTORY" / "Performance & Engagement Dynamics"; segmented 7D/30D/90D; chart glass `h-64` dengan SVG sparkwave (area gradient cobalt→transparent, garis solid `#2333E7`, garis putus `#D4FF32`); legend "Impressions (Reach)" / "Click Through & Saves" / "Peak: Friday +34%"; floating pill "248.5K · Interactions at 18:00 CEST" + `animate-ping`; label Mon–Sun.
   - **3 mini insight** — TOP PERFORMING FORMAT (Short Reels / 8.4x retention multiplier) · VIRAL DRIFT SCORE (94 / 100) · AUDIENCE REACTION (98.2% Positive).
   - **Content Queue** — "POST PIPELINE" / "Content Queue & Upcoming Dispatch" + link "View Calendar"; 3 baris post (thumb 14x14 rounded-xl, pill platform, judul, deskripsi, status pill Ready/Needs Approval/Scheduled, `more_vert`).
4. **Bento kanan (4 col)**:
   - **Connected Hub** — 4 channel (Instagram @frhm.studio 428K fans · TikTok @frhmapp 890K fans · YouTube FRHM Agency TV 112K subs · LinkedIn FRHM Digital Group 45.2K peers), semua badge "SYNCED" + dot `animate-pulse`.
   - **Artistic Branding Showcase** — kartu "DIGITAL SPACE." (cermin login page): capsule cobalt/lavender/lime miring, `fluted-glass-overlay`, "STUDIO IDENTITY" + "✦", sub-card "Campaign Velocity: 98%" + "STATUS: ACCELERATING" + tombol Details.
   - **Quick Campaign Launchpad** — "Need AI Content Hooks?" + tombol "Launch Studio AI".
5. **Footer** — "FRHM" + © 2026 + Privacy Policy / Terms of Service / API Documentation / System Status.

### Gotcha teknis dari audit (WAJIB ditangani)

- **`borderRadius` di-remap, bukan extend**: `DEFAULT: 1rem`, `lg: 2rem`, `xl: 3rem`. Karena ada di `theme.extend`, ia **menimpa** default Tailwind. `rounded-lg` di referensi = **2rem**, `rounded-xl` = **3rem**. Implementasi harus memetakan ke token radius custom, bukan memakai `rounded-lg/xl` bawaan.
- **Header brand span kosong** (`<br>`) — hanya pill "STUDIO" yang tampil.
- **Hero punya pill & `<p>` kosong** — placeholder di referensi.
- **Tidak ada sidebar mobile** — `hidden md:block`, tanpa drawer.
- **`darkMode: "class"` tanpa palet dark terpisah** — hanya pakai token statis (`inverse-surface`, dst.).
- **Aset eksternal** — avatar & thumbnail memakai `lh3.googleusercontent.com/aida-public/...`; harus diganti aset lokal/placeholder.

### DESIGN.md vs code.html — rekonsiliasi

`DESIGN.md` (spesifikasi) dan `code.html` (implementasi) **tidak identik**. Acuan visual = `code.html` (yang dirender jadi `screen.png`), tapi `DESIGN.md` memberi token tambahan:

| Token | `DESIGN.md` | `code.html` | Keputusan |
|---|---|---|---|
| tertiary (Lavender Iris) | `#B775FC` | `#7d3ac0` | Pakai `#7d3ac0` (yang benar-benar dirender); `#B775FC` hanya untuk ambient mesh |
| Ink Void (teks heading) | `#12131A` | — (pakai `#1a1b22`) | Pakai `#1a1b22` (on-surface) |
| Wash canvas | `#F3EDF8`, `#EAF9D9`, `#F8F6FC` | `#fbf8ff` + radial mesh | Pakai mesh `code.html` |
| radius `sm` / `md` | `0.5rem` / `1.5rem` | tidak didefinisikan | Tambahkan ke token admin (berguna untuk nested) |
| shadow Level 1 | `0 24px 60px -12px rgba(67,83,255,0.12)` | dipakai persis di hero | Pakai nilai ini |

Detail spesifikasi yang penting (dari `DESIGN.md` §Elevation & Shapes):
- Level 1 glass frame: `rgba(255,255,255,0.65)` + `blur(40px)` + top border `1px solid rgba(255,255,255,0.85)`.
- Level 2 recessed well: `rgba(255,255,255,0.45)` + `blur(20px)` + `inset 0 1px 1px rgba(255,255,255,0.6)`.
- CTA hover: `translateY(-1px)` + `0 10px 24px -4px rgba(212,255,50,0.6)`; active `scale(0.98)`.
- Input: pill `48px`, bg `rgba(255,255,255,0.95)`, focus ring `0 0 0 2px #4353FF`, padding `0 24px`.
- Checkbox: `rounded-md` 6px, `18x18`, border `1.5px rgba(18,19,26,0.25)`, checked fill `#4353FF`.

## Decisions User (sebelum eksekusi)

| # | Pertanyaan | Keputusan |
|---|---|---|
| A | Hero subtitle — referensi kosong | Pakai teks dummy "Creative Director at work", nanti dikembangkan |
| B | Header brand — referensi kosong (`<br>`) | Ganti dengan logo FRHM full (bukan cuma pill "STUDIO") |
| C | Footer — referensi hanya di dashboard | Terapkan ke semua halaman admin (31 page) |

## Goals / Non-Goals

**Goals**

- Visual parity utuh dengan `_stitch-admin/code.html` untuk dashboard, dan **konsistensi sistem** untuk 30 halaman lain.
- Satu sumber kebenaran style: token + utility class di `admin-stage.css`, bukan class acak per halaman.
- Nol perubahan perilaku: query, mutasi, RLS, URL state, role check tetap identik.

**Non-Goals**

- Tidak menambah/mengubah skema DB, route API, atau service layer.
- Tidak mengadopsi Material Symbols (keputusan user: pakai registry `Icons`).
- Tidak mengubah struktur informasi (IA) / rute. Hanya permukaan visual.
- Tidak menyentuh portal client (`/client/*`) — `.admin-theme` di-scope ke wrapper admin.

## Decisions

### D1 — Scope token: extend `.admin-theme`, jangan sentuh tema global

**Keputusan**: Semua token & utility Luminous Space tinggal di `app/app/admin/admin-stage.css` di bawah `.admin-theme`.

**Alasan**: `PageContainer`, `Button`, `Card` dipakai bersama portal client. Menimpa token global akan merembet ke client. Scope ke `.admin-theme` (dipasang di `admin/layout.tsx`) mengisolasi perubahan.

**Alternatif ditolak**: (a) ubah `globals.css` — merembet ke client; (b) buat theme baru di theme-selector — tidak perlu, admin tidak punya switch theme sendiri.

### D2 — Layer komponen: utility class, bukan rewrite primitive shadcn

**Keputusan**: Bangun lapisan utility (`admin-card`, `admin-chip`, `admin-fluted`, `admin-pill`, `admin-nav-active`, `admin-stat-value`, `admin-section-label`) di CSS, lalu **tempelkan** ke elemen/primitive yang ada. Tidak menulis ulang `components/ui/*`.

**Alasan**: 78 file harus kena. Rewrite primitive = risiko regresi besar di 31 halaman + portal client. Utility class = perubahan lokal, mudah di-review, mudah di-rollback.

**Alternatif ditolak**: fork `Card`/`Button` jadi varian `luminous` — duplikasi API, dan client ikut kena bila lupa scope.

### D3 — Tipografi: Syne + Hanken Grotesk via `--font-syne` / `--font-hanken`

**Keputusan**: Heading & label → Syne (`.admin-theme h1/h2/h3`, `.admin-wordmark`, `.admin-section-label`). Body → Hanken Grotesk (default body). Angka KPI → Syne tabular (`.admin-stat-value`).

**Alasan**: Cocok dengan `DESIGN.md` (`display-hero`/`headline-*`/`label-caps` = Syne; `body-*`/`label-md` = Hanken Grotesk). Font sudah self-host di `app/app/fonts/`.

**Alternatif ditolak**: ikut font override `Geist` di `code.html` — itu artefak injeksi Stitch, bukan bagian sistem desain.

### D4 — Ikon: registry `Icons` + mapping semantik

**Keputusan**: Petakan 26 ikon Material Symbols di referensi ke key `Icons` yang sudah ada; tambah mapping baru hanya bila tidak ada padanan.

| Referensi (Material) | Registry key | Status |
|---|---|---|
| `dashboard` | `dashboard` | ada |
| `hub` | `layers2` | ada |
| `campaign` | `rocket` | ada |
| `calendar_month` | `calendar` | ada |
| `monitoring` | `barChart` | ada |
| `business` | `building2` | ada |
| `add` | `add` | ada |
| `add_circle` | `plusCircle` | ada |
| `settings` | `settings` | ada |
| `help` | `help` | ada |
| `search` | `search` | ada |
| `notifications` | `notification` | ada |
| `apps` | `layers` | ada |
| `ios_share` | `share` | ada |
| `send` | `send` | ada |
| `trending_up` | `trendingUp` | ada |
| `schedule` | `clock` | ada |
| `thumb_up` | `badgeCheck` | ada |
| `bolt` | `flame` | ada |
| `arrow_forward` | `arrowRight` | ada |
| `more_vert` | `ellipsis` | ada |
| `music_note` | `music` | ada |
| `smart_display` | `playCircle` | ada |
| `work` | `billing` | ada |
| `photo_camera` | `media` | ada |
| `auto_awesome` | `sparkles` | ada |

**Alasan**: Menghormati `AGENTS.md` #5. Ukuran ikon Tabler `size-*` sepadan dengan `text-[20px]` referensi.

### D5 — Warna: token MD3 dari referensi → HSL shadcn

**Keputusan**: Petakan token referensi ke variabel yang sudah dipakai sistem:

| Referensi | Hex | Pemakaian admin |
|---|---|---|
| `primary-container` | `#D4FF32` | active nav, chip, primary emphasis → `--brand-accent` |
| `secondary-container` | `#4353FF` | CTA create ("New Post"/"Create Campaign") |
| `tertiary-fixed` | `#F0DBFF` / `tertiary #7D3AC0` | badge status "needs approval" |
| `surface-container-lowest` | `#FFFFFF` | kartu glass dasar |
| `on-surface` | `#1A1B22` | teks utama |
| `outline-variant` | `#C5C9AD` | border halus |

**Alasan**: `admin-stage.css` sudah mendefinisikan `--brand-accent: 73 100% 60%` (≈ `#D4FF32`). Tinggal tambah token cobalt & lavender sebagai variabel terpisah agar CTA/badge tidak salah pakai lime.

### D6 — Motion: terapkan guard `prefers-reduced-motion`

**Keputusan**: Semua animasi (float orb, `animate-ping`, hover lift) dimatikan di `prefers-reduced-motion: reduce`.

**Alasan**: `DESIGN.md` mewajibkan; `admin-stage.css` sudah punya blok guard — perlu diperluas ke animasi baru (sparkline, ping dot).

### D7 — Urutan eksekusi: shell → dashboard → section

**Keputusan**: 3 gelombang. (1) Shell: sidebar, header, nav pills, CSS token. (2) Dashboard: hero, KPI bento, chart, queue. (3) 30 halaman lain per-domain (clients, deliverables, analytics, settings, dst.).

**Alasan**: Shell & dashboard menentukan "bahasa" visual; sisanya mengikuti pola yang sama. Review bertahap mengurangi risiko.

### D8 — Radius: petakan ulang, jangan pakai `rounded-lg`/`rounded-xl` bawaan

**Keputusan**: Definisikan variabel radius di `.admin-theme` (`--admin-radius-card: 1rem`, `--admin-radius-lg: 2rem`, `--admin-radius-xl: 3rem`) dan pakai `rounded-[var(--admin-radius-xl)]` atau utility `.admin-card` yang sudah membungkusnya. **Tidak** memakai `rounded-lg`/`rounded-xl` Tailwind langsung di komponen admin.

**Alasan**: Referensi me-remap `borderRadius` di `theme.extend` sehingga `rounded-lg` = 2rem dan `rounded-xl` = 3rem. Tailwind repo (shadcn) memakai `rounded-lg` = 0.5rem. Kalau kita pakai `rounded-xl` biasa, sudut kartu akan jauh lebih tajam daripada referensi — visual meleset.

**Alternatif ditolak**: mengubah `borderRadius` global di `tailwind.config.cjs` — akan merusak seluruh UI lain (client portal, komponen shadcn).

### D9 — Sidebar mobile: tambah drawer (referensi tidak punya)

**Keputusan**: Pertahankan `SidebarProvider` + `Sidebar` shadcn yang sudah punya perilaku mobile (drawer/sheet), tapi gaya visualnya disamakan dengan referensi.

**Alasan**: Referensi hanya `hidden md:block` tanpa drawer — di mobile sidebar hilang total dan tidak ada cara navigasi. Itu cacat UX, bukan fitur. `AGENTS.md` mewajibkan UI berfungsi; kita ambil gaya referensi, bukan cacatnya.

## Risks / Trade-offs

- **[Regresi pada 78 file]** → Restyle inkremental per gelombang; `npx tsc --noEmit` + screenshot Playwright tiap gelombang.
- **[Bentrok `!important` di `admin-stage.css` dengan primitive shadcn]** → Batasi `!important` hanya pada override `data-slot` sidebar (sudah ada); hindari menambah yang baru.
- **[Chart tanpa library]** → Referensi hanya SVG statis. Pakai SVG statis dengan angka **dari DB** (bukan hardcode); tidak menambah dependency chart.
- **[Duplikasi style bila utility kurang]** → Audit di akhir: cari class mentah berulang, promosikan jadi utility.
- **[Kontras lime di dark mode]** → `--brand-accent` dark = `73 100% 66%`; verifikasi WCAG AA pada teks di atas lime.
- **[`PageContainer` dipakai bersama client]** → Restyle heading admin via `.admin-theme h1/h2/h3` (scoped), tidak edit `PageContainer`.

## Migration Plan

1. **Gelombang 1 — Shell**: perbarui `admin-stage.css`, `layout.tsx`, `header.tsx`, `app-sidebar.tsx`, `nav-main.tsx`. Verifikasi: semua rute admin render, nav aktif benar.
2. **Gelombang 2 — Dashboard**: `dashboard/page.tsx`, `layout.tsx`, dan slot `@*`. Verifikasi: screenshot vs `_stitch-admin/screen.png`.
3. **Gelombang 3 — Halaman lain**: 30 halaman per domain. Verifikasi: `tsc` 0 error, 0 console error, screenshot.
4. **Rollback**: setiap gelombang = commit terpisah; revert commit bila regresi. Tidak ada perubahan data/skema sehingga rollback murni kode.

## Open Questions

- Apakah chart analytics perlu data series nyata dari `metrics_by_client` atau cukup ringkasan agregat yang sudah ada? (Bisa diputuskan saat implementasi tanpa mengubah spec.)
- Apakah social-channel hub (IG/TT/YT/LI) perlu data channel nyata dari DB, atau ditampilkan sebagai status koneksi dari tabel yang sudah ada? (Idem.)
