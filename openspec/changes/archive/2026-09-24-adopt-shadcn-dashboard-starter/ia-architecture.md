# Information Architecture (IA) Frhm: Pemisahan Admin vs Client

> Sesuai arahan Tahap 1: Memisahkan fitur berdasarkan tujuan user (Review, Approval, Report), menegaskan role Admin vs Client, dan menentukan 1 primary action per view.

---

## 1. Pemetaan 3 Pilar Utama Client (Pak Adit - Taraju)

| Pilar | Domain | URL Tujuan | Fungsi & Kegunaan | Indikator / Badge |
| :--- | :--- | :--- | :--- | :--- |
| **1. Approvals** | Pusat Keputusan | `/client/approvals` | Daftar postingan sosial media dan dokumen materi yang siap tayang dan membutuhkan keputusan client (Approve / Revisi). | Badge angka pending (`count > 0`, warna oranye/merah) |
| **2. Review Content** | Kalender & Perencanaan | `/client/calendar` | Melihat kalender jadwal tayang, visual preview konten yang sudah terjadwal atau dalam antrean, serta deliverable brief. | - |
| **3. Reports** | Ringkasan & Performa | `/client/dashboard` | Ringkasan pencapaian brand, metrik tayang, deliverable terbaru, dan status pengerjaan agensi (`pipeline`). | - |

> **Catatan Pengaturan Akun & Telegram:**  
> Pengaturan profil dan notifikasi Telegram (`/client/settings`) dikeluarkan dari bottom bar utama dan diletakkan di **User Avatar Dropdown** pada Header kanan atas (Desktop & Mobile Header), sehingga tidak membebani navigasi utama.

---

## 2. Pemisahan Total Surface: Admin vs Client

### A. Surface Admin (`/app/admin/*`)
* **Role Guard:** `users.role === 'admin'` (jika non-admin, redirect ke `/client/dashboard`).
* **Header Chrome:** `AdminHeader` dengan Command Search (`Cmd+K`), Theme Toggle, Infobar Drawer, Notifikasi, User Avatar.
* **Sidebar Groups:**
  1. `OVERVIEW` (Dashboard, Global Pipeline, Analytics, Kalender)
  2. `OPERATIONS` (Content Production, KOL & Vendor CRM, Batch Automations)
  3. `CLIENTS` (Client Workspace + Quick Add Client `+`)
  4. `AI CORE` (Skill Library, Pengaturan AI)
  5. `SYSTEM` (Pengaturan Utama, Bridge, Users, Audit Log)

### B. Surface Client (`/app/client/*`)
* **Role Guard:** `users.role === 'client'` (jika admin, redirect ke `/admin/dashboard`). Client tidak memiliki akses ke rute `/admin/*`.
* **Header Chrome (`ClientHeader`):**
  * Sisi Kiri: Logo Frhm + Brand Selector / Nama Brand ("Taraju") + Breadcrumbs ringkas.
  * Sisi Kanan: Theme Toggle + User Avatar Dropdown (Profil, Notifikasi Telegram, Log Out).
* **Sidebar Desktop:**
  * Fokus 3 Pilar:
    1. **Approvals** (`/client/approvals`) — dengan badge jumlah item pending.
    2. **Review & Kalender** (`/client/calendar`)
    3. **Laporan & Ringkasan** (`/client/dashboard`)
* **Mobile Navigation (`BottomNav`):**
  * Dirampingkan dari **6 tab berdesakan** menjadi **3 tab utama yang lega**:
    1. `[Approvals]` (icon centang/alert dengan badge pending)
    2. `[Kalender]` (icon kalender untuk review jadwal tayang)
    3. `[Laporan]` (icon bar chart / home untuk overview)
  * Touch target memenuhi standar aksesibilitas minimum 44x44px.

---

## 3. Matriks Primary Action per Halaman

Untuk mencegah *decision fatigue* dan kompetisi visual, setiap tampilan memiliki tepat **1 Primary Action** yang menonjol:

| Halaman | Primary Action (Warna Dominan) | Secondary Action (Outline / Ghost) | Overflow Menu (`...`) |
| :--- | :--- | :--- | :--- |
| **`/client/approvals`** | **Approve** (Setujui konten) | **Minta Revisi** | Salin tautan preview, lihat histori brief |
| **`/client/deliverables/[id]`** | **Setujui Dokumen** | **Minta Revisi** | Unduh (.md), cetak PDF |
| **`/client/calendar`** | **Lihat Detail Hari/Postingan** | Ganti tampilan (Bulan/Minggu) | Ekspor jadwal |
| **`/client/dashboard`** | **Review Pending Approvals** (Jika ada pending) | Lihat arsip konten | Hubungkan Telegram |
