# Sidebar Stitch Parity - Tasks

- [x] 1.1 Konfigurasi Nav Data (`config/nav-config.ts`): `adminNavStitch` berisi 7 item flat (Overview, Marketing ERP, Social Accounts, Composer, Campaigns, Content Calendar, Analytics) dengan ikon valid (`dashboard`, `layers`, `hub`, `rocket`, `campaign`, `calendar_month`, `monitoring`).
- [x] 2.1 Refactor `app-sidebar.tsx`: Ganti hardcoded `NAV_ITEMS` menjadi impor `adminNavStitch` dari `nav-config.ts`.
- [x] 2.2 Hapus client switcher dinamis (dropdown `clientsOpen`) + tombol "Create New Client" dari sidebar.
- [x] 2.3 Ganti styling ke token semantik Luminous (`bg-background/85`, `bg-primary`, `text-muted-foreground`, `border-border`, `bg-card/95`) dan hapus inline `style={{ background: "rgba(...)" }}`.
- [x] 2.4 Wiring CTA `New Post` -> `/admin/composer?clientId=...` (mempertahankan `activeClientId` dari nuqs).
- [x] 3.1 Bersihkan prop `clients` pada `app/admin/layout.tsx` (tidak lagi diteruskan ke `AppSidebar`).
- [x] 4.1 Verifikasi: `tsc --noEmit` 0 error + Playwright visual audit PASS (login -> dashboard -> Social Accounts).
