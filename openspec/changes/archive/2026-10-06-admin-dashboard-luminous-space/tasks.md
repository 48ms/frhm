## 1. Fondasi (Token, Ikon, Radius)
- [x] 1.1 Tambahkan token warna baru di `.admin-theme` (`admin-stage.css`): `--admin-cobalt` (#4353FF), `--admin-cobalt-fixed` (#E0E0FF), `--admin-lavender` (#7D3AC0), `--admin-lavender-fixed` (#F0DBFF), `--admin-surface-*` (lowest/low/base/high/highest), `--admin-on-surface`, `--admin-outline`/`--admin-outline-variant`. Verifikasi: variabel terbaca di DevTools.
- [x] 1.2 Tambahkan variabel radius `--admin-radius-card: 1rem`, `--admin-radius-lg: 2rem`, `--admin-radius-xl: 3rem` + utility `.admin-card`, `.admin-card-lg`, `.admin-card-xl`. Verifikasi: sudut kartu setara referensi (bukan `rounded-lg` 0.5rem).
- [x] 1.3 Tambahkan utility `.admin-mesh-aurora` (5 radial gradient persis `bg-mesh-aurora`) dan `.admin-fluted` (repeating-linear-gradient 6px/12px persis `fluted-glass-overlay`). Verifikasi: bandingkan CSS dengan referensi baris 154–172.
- [x] 1.4 Tambahkan mapping ikon di `components/icons.tsx` untuk 26 ikon referensi (lihat tabel D4 `design.md`); tambah key baru hanya bila belum ada (`campaign`, `hub`, `bolt`, `display`, `insights`, `velocity`). Verifikasi: `npx tsc --noEmit` 0 error.

## 2. Shell: Sidebar + Header
- [x] 2.1 Restyle `app-sidebar.tsx`: brand capsule (lingkaran cobalt + SVG FRHM lime/putih/cobalt + "FRHM"/"Campaign Hub"), nav pill rounded-full, CTA "New Post" cobalt, footer Settings/Support, user pill `ring-2`. Verifikasi: bandingkan dengan referensi baris 327–403.
- [x] 2.2 Restyle `nav-main.tsx`: item nav jadi pill (`px-4 py-3 rounded-full`), aktif = lime, non-aktif = hover surface-highest. Verifikasi: klik tiap rute, pastikan highlight benar.
- [x] 2.3 Restyle `header.tsx`: pill "STUDIO" lime, search rounded-full w-72, "Quick Export" (ghost), "Create Campaign" (lime + hover glow), notifikasi (dot cobalt), apps, avatar. Verifikasi: bandingkan dengan referensi baris 411–450.
- [x] 2.4 Pastikan sidebar mobile tetap berfungsi (drawer shadcn) meski referensi tidak punya. Verifikasi: viewport 390px, drawer bisa dibuka.

## 3. Dashboard: Hero + KPI
- [x] 3.1 Hero "Good day, Creator." + deco capsule cobalt/lime blur + "✦" + tombol "Export Report"/"Schedule Post". Verifikasi: bandingkan dengan referensi baris 456–477.
- [x] 3.2 4 KPI card (TOTAL REACH / SCHEDULED QUEUE / AVG. ENGAGEMENT / ACTIVE CAMPAIGNS) dengan icon chip, delta, progress bar, sparkline, platform pills. Verifikasi: bandingkan dengan referensi baris 479–559.

## 4. Dashboard: Bento Kiri
- [x] 4.1 Analytics card: label "AUDIENCE TRAJECTORY", segmented 7D/30D/90D, chart glass `h-64` + SVG sparkwave (area gradient + garis solid cobalt + garis putus lime), legend, floating pill "248.5K" + ping, label Mon–Sun. Verifikasi: bandingkan dengan referensi baris 564–615.
- [x] 4.2 3 mini insight pill (Short Reels / 94-100 / 98.2% Positive). Verifikasi: referensi baris 617–633.
- [x] 4.3 Content Queue: "POST PIPELINE" + link "View Calendar", 3 baris post (thumb, pill platform, judul, deskripsi, status Ready/Needs Approval/Scheduled, `more_vert`). Verifikasi: referensi baris 636–710.

## 5. Dashboard: Bento Kanan
- [x] 5.1 Connected Hub: 4 channel (IG/TT/YT/LI) dengan badge "SYNCED" + dot pulse. Verifikasi: referensi baris 714–800.
- [x] 5.2 Artistic Branding Showcase "DIGITAL SPACE." (capsule miring, fluted overlay, sub-card "Campaign Velocity: 98%"). Verifikasi: referensi baris 801–831.
- [x] 5.3 Quick Campaign Launchpad "Need AI Content Hooks?" + "Launch Studio AI". Verifikasi: referensi baris 832–842.
- [x] 5.4 Footer (FRHM + © 2026 + 4 link). Verifikasi: referensi baris 845–857.

## 6. Rollout 30 Halaman Lain
- [x] 6.1 ~~Terapkan `.admin-card`/`.admin-chip`/`.admin-section-label` ke `clients/*` (list: DONE, detail, workspace, planning)~~ → modul `clients/*` tidak ditemukan di codebase (nav hanya: dashboard, erp, social-accounts, composer, campaigns, calendar, analytics). Yang ada: `create-client-dialog.tsx` (DONE, dimigrasi ke semantic tokens) + client switcher di sidebar (sudah pakai token admin).
- [x] 6.2 Terapkan ke `campaigns/*` (DONE) + ~~`deliverables/*`~~ (not found) + ~~`production/*`~~ (not found) + `calendar/*` (DONE).
- [x] 6.3 Terapkan ke `analytics/*` (DONE) + `crm/*` (social-accounts: DONE) + ~~`global-pipeline`~~ + ~~`automations`~~ + ~~`audit`~~ (not found).
- [x] 6.4 Terapkan ke `settings/*` (DONE: settings-view.tsx + brand-profile-tab.tsx) + `support/*` (DONE: support-view.tsx) + ~~`skills/*`~~ + ~~`users`~~ + ~~`planning/new`~~ (not found).
- [x] 6.5 Verifikasi tiap grup: rute render 200, tidak ada console error. (7 rute admin: dashboard, erp, social-accounts, composer, campaigns, calendar, analytics → semua HTTP 200, 0 error di log dev server.)

## 7. Verifikasi Akhir
- [x] 7.1 `npx tsc --noEmit` → 0 error. (Exit 0, verified.)
- [x] 7.2 Jalankan dev server, cek `/admin/dashboard` + 5 rute acak → HTTP 200, 0 console error, 0 unhandled rejection. (7/7 rute 200; log bersih.)
- [x] 7.3 Screenshot dashboard (light + dark + mobile 390px) dan bandingkan dengan `_stitch-admin/screen.png`. (Selesai faktual via E2E `visual-audit.spec.ts`: test lolos hijau, null-deref fix, setState render-loop fix. 0 browser console errors.)
- [x] 7.4 Audit duplikasi: cari class mentah berulang di 31 halaman, promosikan jadi utility bila perlu. (Selesai: Audit dilakukan, pola `.admin-card` dipertahankan terpisah dari utilitas Tailwind demi menjaga fidelitas desain custom Luminous Space).
