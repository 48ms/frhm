# Blueprint: Standardisasi Total Workspace (Pilihan B)

## Objektif
Mengubah arsitektur navigasi dan scope Frhm Studio menjadi standar SaaS modern (Linear/Vercel pattern). 1 Workspace Switcher = 1 Single Source of Truth untuk SEMUA halaman.

## Fase 1: Per-Client Scope Strictness (Refactor Global Pages)
- [ ] **ERP (`/admin/erp`)**: Refactor `erp-client.tsx` untuk menggunakan `useActiveDashboard()`. Hapus grid "Per Client", ubah metrik total menjadi metrik khusus klien aktif.
- [ ] **Social Accounts (`/admin/social-accounts`)**: Refactor `social-accounts-board.tsx`. Hapus mapping semua klien, fokuskan board HANYA pada channel milik `clientId` aktif.

## Fase 2: Sidebar Workspace Switcher
- [ ] Buat komponen `workspace-switcher.tsx` (dropdown list klien + tombol Add Client).
- [ ] Integrasikan ke bagian teratas `app-sidebar.tsx`.

## Fase 3: Pembersihan Duplikat (Redundancy Removal)
- [ ] **Hero (`hero.tsx`)**: Hapus listbox dropdown, sisakan lencana statis (read-only) untuk klien yang aktif.
- [ ] **Right Panel (`right-panel.tsx`)**: Hapus dropdown klien, sisakan tampilan channel untuk klien yang terhubung.
- [ ] **Campaigns Board**: Hapus chip switcher di atas board.

## Fase 4: Routing & Halaman Klien
- [ ] Buat `/admin/clients/page.tsx` (Daftar semua klien, tabel overview).
- [ ] Buat `/admin/clients/[id]/page.tsx` (Client Workspace dengan tab: Overview, Content, Deliverables, Skills, Settings). Memenuhi 11 e2e tests.
- [ ] Update `header.tsx`: Fungsikan tombol "Create Campaign" dan "Quick Export".
