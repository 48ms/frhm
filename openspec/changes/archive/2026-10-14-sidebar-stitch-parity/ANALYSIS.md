# Sidebar: Parity Mutlak dengan Referensi Stitch

**Referensi:** `openspec/changes/sidebar-stitch-parity/_stitch-admin/code.html` (blok `<aside>`)

## 1. Spesifikasi Referensi (apa yang harus direplika)

### 1.1 Shell

```
<aside class="fixed left-0 top-0 h-screen w-64 z-30
              bg-surface-container-low/70 dark:bg-inverse-surface/60
              backdrop-blur-2xl shadow-md
              border-r border-outline-variant/30 dark:border-outline/20
              hidden md:block">
  <div class="flex flex-col justify-between h-full p-4">
```

- Lebar `w-64` (16rem), full-height, fixed kiri.
- Permukaan: `bg-surface-container-low/70` (translucent) + `backdrop-blur-2xl` + `shadow-md`.
- Border kanan: `border-outline-variant/30` (light) / `border-outline/20` (dark).
- Layout internal: `flex flex-col justify-between h-full p-4` — **top block dan bottom block dipisah oleh `justify-between`**, bukan overflow scroll.
- Hidden di mobile: `hidden md:block`.

### 1.2 Urutan struktur (atas -> bawah)

| # | Blok | Markup referensi | Isi teks |
|---|------|------------------|----------|
| 1 | **Brand Capsule** | `div flex items-center gap-3 px-3 py-3 mb-6 bg-surface-container-lowest/80 backdrop-blur-md rounded-full shadow-sm border border-white/60` | logo `w-10 h-10 rounded-full bg-secondary-container` (cobalt) + teks `FRHM` / `Campaign Hub` |
| 2 | **Primary Nav** | `<nav aria-label="Main Navigation" class="space-y-1.5">` | 6 item flat, **tanpa group label** |
| 3 | **CTA** | `div.mt-6.px-1 > button` | pill cobalt `bg-secondary-container`, label `New Post` |
| 4 | **Footer** | `div.pt-4.border-t.border-outline-variant/30` | 2 item: `Settings`, `Support`, lalu User Pill |

### 1.3 Primary Navigation -- 6 item flat (urut, teks dan ikon persis)

| # | Teks | `data-icon` | URL tujuan (proyek nyata) | Status |
|---|------|-------------|---------------------------|--------|
| 1 | `Overview` | `dashboard` | `/admin/dashboard` | ada (aktif default) |
| 2 | `Social Accounts` | `hub` | _belum ada_ | ⚠️ buat placeholder atau arahkan |
| 3 | `Campaigns` | `campaign` | _belum ada_ | ⚠️ buat placeholder atau arahkan |
| 4 | `Content Calendar` | `calendar_month` | `/admin/calendar` | ada |
| 5 | `Analytics` | `monitoring` | `/admin/analytics` | ada |
| 6 | `Client` | `business` | `/admin/clients` | ada |

- Aktif: `bg-primary-container text-on-primary-container rounded-full shadow-sm` (lime `#D4FF32`)
- Tidak aktif: `text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-highest/60 dark:hover:bg-surface-variant/30 hover:text-on-surface dark:hover:text-inverse-on-surface`
- Semua item: `flex items-center gap-3 px-4 py-3 rounded-full font-label-lg text-label-lg transition-colors duration-200 active:scale-[0.98]`
- Ikon referensi: `<span class="material-symbols-outlined text-[20px]" data-icon="dashboard">dashboard</span>`

### 1.4 CTA Button

```
<button class="w-full flex items-center justify-center gap-2 py-3 px-4
               rounded-full bg-secondary-container text-on-secondary
               font-label-caps text-label-caps tracking-widest shadow-md
               hover:bg-secondary active:scale-95 transition-all duration-150">
  <span class="material-symbols-outlined text-[18px]">add</span>
  New Post
</button>
```

### 1.5 Footer

```
<div class="pt-4 border-t border-outline-variant/30">
  <a class="flex items-center gap-3 px-4 py-2.5 rounded-full ...">settings -> Settings</a>
  <a class="flex items-center gap-3 px-4 py-2.5 rounded-full ...">help -> Support</a>
  <!-- User Pill -->
  <div class="mt-3 p-2.5 bg-surface-container-lowest/80 rounded-2xl flex items-center gap-2.5 border border-white/60">
    <img class="w-8 h-8 rounded-full object-cover ring-2 ring-primary-container">
    <p class="font-label-lg text-label-lg text-on-surface leading-tight truncate">Amara Vance</p>
    <p class="font-body-sm text-body-sm text-outline truncate">Design Lead</p>
  </div>
</div>
```

---

## 2. Kondisi Proyek Saat Ini

### 2.1 Wiring komponen saat ini

```
app/admin/layout.tsx (server: auth + fetch clients dari Supabase)
  └ CreateClientProvider
      └ SidebarProvider
          ├ AppSidebar (components/app-sidebar.tsx)
          │   ├ SidebarHeader -> brand capsule (FRHM / Campaign Hub)
          │   ├ SidebarContent -> NavMain x 4 group
          │   │      └ NavMain (components/nav-main.tsx)
          │   │           ├ SidebarGroup / SidebarGroupLabel
          │   │           └ SidebarMenu -> SidebarMenuItem -> SidebarMenuButton
          │   │                  data: adminNavGroups (config/nav-config.ts)
          │   │                  active: isActiveFor(pathname) (hooks/use-nav.ts)
          │   │                  ikon: Icons (components/icons.tsx)
          │   │                  sub-menu: Collapsible untuk client list
          │   └ SidebarFooter -> Settings / Support + NavUser (nav-user.tsx)
          └ SidebarInset -> AdminHeader + main + AdminFooter
```

### 2.2 Struktur nav-config saat ini (4 group, 11 item)

| Group | Item | URL |
|-------|------|-----|
| `OVERVIEW` | Dashboard, Global Pipeline, Analytics, Kalender | `/admin/dashboard`, `/admin/global-pipeline`, `/admin/analytics`, `/admin/calendar` |
| `OPERATIONS` | Content Production, Deliverables, KOL & Vendor CRM, Batch Automations | `/admin/production`, `/admin/deliverables`, `/admin/crm`, `/admin/automations` |
| `CLIENTS` | Client Workspace (+ sub-list client dinamis) | `/admin/clients` |
| `SYSTEM` | AI Studio, Settings | `/admin/skills`, `/admin/settings` |

### 2.3 Rute admin yang ada (26 total)

`/admin/analytics`, `/admin/analytics/benchmark`, `/admin/audit`, `/admin/automations`, `/admin/calendar`, `/admin/clients`, `/admin/clients/[id]`, `/admin/clients/[id]/planning`, `/admin/crm`, `/admin/crm/[id]`, `/admin/dashboard`, `/admin/deliverables`, `/admin/deliverables/[id]`, `/admin/deliverables/new`, `/admin/global-pipeline`, `/admin/planning/new`, `/admin/production`, `/admin/settings`, `/admin/settings/ai`, `/admin/settings/audit`, `/admin/settings/bridge`, `/admin/settings/telegram`, `/admin/settings/users`, `/admin/skills`, `/admin/skills/[id]`, `/admin/users`

---

## 3. Gap Analysis: Referensi vs Saat Ini

| # | Aspek | Referensi | Saat Ini | Gap |
|---|-------|-----------|----------|-----|
| 1 | **Jumlah group** | 1 nav flat, tanpa label | 4 group ber-label (`OVERVIEW`, `OPERATIONS`, `CLIENTS`, `SYSTEM`) | Total beda |
| 2 | **Jumlah item** | 6 | 11 (+ sub-list client) | Referensi jauh lebih sedikit |
| 3 | **Label item** | `Overview`, `Social Accounts`, `Campaigns`, `Content Calendar`, `Analytics`, `Client` | campur ID/EN: `Dashboard`, `Kalender`, `KOL & Vendor CRM`, `Batch Automations` | Beda total |
| 4 | **Ikon** | Material Symbols (`dashboard`, `hub`, `campaign`, `calendar_month`, `monitoring`, `business`) | `Icons` custom (Lucide) | Beda sistem, tapi semua 6 nama sudah ada di registry `Icons` |
| 5 | **Group label** | tidak ada | ada (`admin-group-label`) | Beda |
| 6 | **Active state** | lime capsule `bg-primary-container` | `.admin-nav-active` (lime capsule) | SUDAH COCOK |
| 7 | **Brand capsule** | logo cobalt + `FRHM` / `Campaign Hub` | logo cobalt + `FRHM` / `Campaign Hub` | SUDAH COCOK |
| 8 | **CTA** | pill cobalt `New Post` (create post) | pill cobalt `New Post` (aksi = `openCreateClient`) | Bentuk cocok, **wiring salah** |
| 9 | **User pill** | statis: avatar + nama + role | DropdownMenu (avatar + nama/email + logout) | Bentuk cocok, fungsi beda |
| 10 | **Rute `Social Accounts` & `Campaigns`** | ada di nav referensi | **tidak ada** di proyek | Referensi nunjukin ke `#` (placeholder) |

### 3.1 Ikon: tidak perlu Material Symbols

Referensi memakai `<span class="material-symbols-outlined">`, tapi registry `Icons` (components/icons.tsx) **sudah punya** semua nama yang dipakai:

| `data-icon` referensi | Key `Icons` | Komponen |
|-----------------------|-------------|----------|
| `dashboard` | `dashboard` | `IconLayoutDashboard` |
| `hub` | `hub` | `IconLayersLinked` |
| `campaign` | `campaign` | `IconRocket` |
| `calendar_month` | `calendar_month` | `IconCalendar` |
| `monitoring` | `monitoring` | `IconChartBar` |
| `business` | `business` | `IconBuildingSkyscraper` |
| `add` | `add` | `IconPlus` |

Rekomendasi: tetap pakai `Icons` (Lucide). Memakai Material Symbols = menambah dependensi font baru (Google Fonts CDN) untuk 8 ikon doang. Parity visual tetap tercapai karena setiap nama sudah ada 1:1.

### 3.2 Mapping URL untuk 6 item

| Teks | URL | Status rute |
|------|-----|-------------|
| `Overview` | `/admin/dashboard` | ada |
| `Social Accounts` | _belum ada_ | Buat placeholder atau arahkan ke `/admin/clients` |
| `Campaigns` | _belum ada_ | Buat placeholder atau arahkan ke `/admin/global-pipeline` |
| `Content Calendar` | `/admin/calendar` | ada |
| `Analytics` | `/admin/analytics` | ada |
| `Client` | `/admin/clients` | ada |

---

## 4. Keputusan

**Pilihan: Parity mutlak.** Sidebar admin mengikuti referensi 1:1 -- 1 nav flat 6 item, teks dan ikon persis sama, tanpa group label. Rute tambahan (Global Pipeline, Production, Deliverables, CRM, Automations, Skills) tetap ada dan dapat dijangkau dari tempat lain (dashboard, header, internal page link), tapi **tidak muncul di sidebar**.

### 4.1 Konsekuensi parity mutlak

1. **Hapus group label** -- `OVERVIEW` / `OPERATIONS` / `CLIENTS` / `SYSTEM` hilang dari sidebar.
2. **Hapus 5 dari 11 item** dari sidebar: Global Pipeline, Content Production, Deliverables, KOL & Vendor CRM, Batch Automations, AI Studio (sisanya 6 item referensi).
3. **Rename label:**
   - `Dashboard` -> `Overview`
   - `Kalender` -> `Content Calendar`
   - `Client Workspace` -> `Client`
4. **Ganti ikon:**
   - `Dashboard` -> `Overview`: `dashboard` (sudah benar)
   - `Social Accounts`: `hub` (baru)
   - `Campaigns`: `campaign` (baru)
   - `Content Calendar`: `calendar_month` (baru; sekarang `calendar`)
   - `Analytics`: `monitoring` (baru; sekarang `trendingUp`)
   - `Client`: `business` (baru; sekarang `workspace`)
5. **Sub-list client dinamis** (dari Supabase) dihapus dari sidebar. Client list pindah ke halaman `/admin/clients` (yang ada kanban board-nya).
6. **CTA `New Post`** diperbaiki wiring-nya: dari `openCreateClient` -> buat post baru (atau arahkan ke flow yang benar).
7. **Footer**: `Settings` -> `/admin/settings`, `Support` -> `/admin/audit` (sekarang `Support` ke `/admin/audit`, perlu verifikasi).
8. **User pill**: ganti dari DropdownMenu ke pill statis (avatar + nama + role). Logout pindah ke user pill click -> dropdown, atau biarkan dropdown tapi bentuknya pill.
9. **Aksi `+` di group `CLIENTS`** (CreateClientProvider) dihapus dari sidebar; tombol create client pindah ke halaman `/admin/clients`.

### 4.2 Rute yang tidak terjangkau dari sidebar (setelah parity)

Rute berikut tetap berfungsi, tapi tidak ada link di sidebar:

- `/admin/global-pipeline` -> akses dari Overview (dashboard) card
- `/admin/production` -> akses dari Overview
- `/admin/deliverables` -> akses dari Campaigns/Content Calendar
- `/admin/crm` -> akses dari Client
- `/admin/automations` -> akses dari Overview
- `/admin/skills` -> akses dari Settings
- `/admin/clients/[id]` -> akses dari Client page

---

## 5. Tahapan Kerja

### Fase 1: Data nav-config (backend data)
- [ ] 1.1 Tambah `adminNavStitch: NavItem[]` baru di `config/nav-config.ts` -- 6 item flat, label & ikon persis referensi.
- [ ] 1.2 Mapping URL: `Overview` -> `/admin/dashboard`, `Social Accounts` -> ???, `Campaigns` -> ???, `Content Calendar` -> `/admin/calendar`, `Analytics` -> `/admin/analytics`, `Client` -> `/admin/clients`.
- [ ] 1.3 Putuskan URL `Social Accounts` & `Campaigns` (placeholder `#` atau arahkan ke rute yang ada).

### Fase 2: Komponen sidebar
- [ ] 2.1 `components/app-sidebar.tsx`: ganti `groups.map(NavMain)` -> render 6 item flat tanpa group label, tanpa `admin-group-label`.
- [ ] 2.2 Hapus sub-list client dinamis + aksi `+` dari sidebar.
- [ ] 2.3 Ganti `Icons.calendar` -> `Icons.calendar_month`, `Icons.trendingUp` -> `Icons.monitoring`, `Icons.workspace` -> `Icons.business`.
- [ ] 2.4 CTA `New Post`: perbaiki wiring (bukan `openCreateClient`).
- [ ] 2.5 Footer: `Settings` -> `/admin/settings`, `Support` -> ??? (verify tujuan).
- [ ] 2.6 User pill: ganti DropdownMenu -> pill statis (atau pill-shaped dropdown).

### Fase 3: Glassmorphism & styling
- [ ] 3.1 Verifikasi `[data-slot="sidebar-container"] > div` di `admin-stage.css` menghasilkan `bg-surface-container-low/70 + backdrop-blur-2xl + shadow-md + border-r border-outline-variant/30`.
- [ ] 3.2 Sesuaikan jika masih ada perbedaan (blur 24px sekarang vs 2xl=40px referensi).
- [ ] 3.3 Item non-aktif: verifikasi `hover:bg-surface-container-highest/60` ada.

### Fase 4: Verifikasi
- [ ] 4.1 Screenshot sidebar (light + dark) vs `_stitch-admin/screen.png`.
- [ ] 4.2 `npx tsc --noEmit` exit 0.
- [ ] 4.3 `npx eslint .` exit 0 (atau error berkurang).
- [ ] 4.4 Playwright: klik setiap item nav, verifikasi routing.

## 6. Catatan

- `NavMain` dan `SidebarGroupLabel` mungkin jadi unused setelah ini -- periksa pemakaian lain sebelum hapus.
- `clientNavGroups` (sidebar client portal) **tidak diubah** -- parity ini hanya untuk admin.
- `settingsNavGroups` (sub-nav `/admin/settings`) tidak diubah.
- Rute yang dihapus dari sidebar tidak dihapus dari proyek -- hanya tidak terlihat di nav.
