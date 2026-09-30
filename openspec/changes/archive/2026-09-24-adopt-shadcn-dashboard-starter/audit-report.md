# Laporan Audit Kondisi Saat Ini (Tahap 0)

> Berdasarkan pemeriksaan langsung kode sumber di `Tools Frahma/app` per 24 September 2026.

---

## 1. Inventarisasi Struktur Folder & Routing

### A. Surface Client (`/app/client/*`)
* Digunakan oleh: **Pak Adit (Taraju)** dan Bunda (Pawon Sengon).
* Routing & Komponen Terkait:
  1. `/client/dashboard` (`app/app/client/dashboard/page.tsx`): Ringkasan status konten, metrik ringkas, deliverable terbaru, connect Telegram.
  2. `/client/pipeline` (`app/app/client/pipeline/page.tsx`): Tracking progres pengerjaan modul/skills agensi Frhm (`pipeline_stages`, `client_skills`).
  3. `/client/calendar` (`app/app/client/calendar/page.tsx`, `calendar-client.tsx`): Kalender jadwal tayang konten sosial media (`scheduled_posts`).
  4. `/client/deliverables` (`app/app/client/deliverables/page.tsx`, `page-client.tsx`): Daftar deliverable (dokumen/strategi brand) berbasis tabel `deliverables`.
  5. `/client/deliverables/[id]` (`app/app/client/deliverables/[id]/page.tsx`): Halaman detail materi deliverable, aksi approve/revisi, riwayat komentar, unduh Markdown.
  6. `/client/approvals` (`app/app/client/approvals/page.tsx`, `components/client/approval-board.tsx`): Kanban/kartu approval untuk postingan media sosial (`platform_posts`).
  7. `/client/settings` (`app/app/client/settings/page.tsx`, `client.tsx`): Pengaturan profil client dan toggle notifikasi Telegram.
* Shell Layout:
  * Desktop: `AppSidebar` (`role="client"`) + header minimalis (`SidebarTrigger` + Teks Frhm).
  * Mobile: `BottomNav` (`components/bottom-nav.tsx`) memuat **6 tab ikon**.

### B. Surface Admin (`/app/admin/*`)
* Digunakan oleh: **Bima (Frhm Operator/Admin)**.
* Routing & Modul Utama:
  * Overview: `/admin/dashboard`, `/admin/global-pipeline`, `/admin/analytics`, `/admin/calendar`
  * Operations: `/admin/production`, `/admin/crm`, `/admin/automations`
  * Clients: `/admin/clients`, `/admin/clients/[id]`
  * AI Core: `/admin/skills`, `/admin/settings/ai`
  * System: `/admin/settings`, `/admin/settings/bridge`, `/admin/settings/users`, `/admin/settings/audit`
* Shell Layout:
  * Desktop: `AppSidebar` (`role="admin"`) + `AdminHeader` lengkap (`SidebarTrigger`, `Breadcrumbs`, `AdminCommandSearch` Cmd+K, `ThemeToggle`, `InfobarTrigger`, `Bell`, User Avatar).

---

## 2. Pemetaan Masalah Navigasi & Tombol (Temuan Faktual)

### 🔴 Masalah 1: Redundansi & Tab Ganda untuk Approval (Dual Deliverable Systems)
* **Fakta:** Saat ini terdapat 2 tempat persetujuan yang berjalan terpisah di sisi client:
  1. `/client/deliverables`: Menangani tabel `deliverables` (dokumen/brief/strategi).
  2. `/client/approvals`: Menangani tabel `platform_posts` (postingan feed/reels/stories).
* **Dampak:** Di navigasi client ada tab **"Deliverable Saya"** dan **"Content Approvals"**. Di mobile bottom nav ada 2 icon terpisah yang sama-sama menampilkan badge pending. Pak Adit (Taraju) bingung membedakan mana yang harus ia setujui saat membuka aplikasi.

### 🔴 Masalah 2: Bottom Navigation Mobile Terlalu Padat (6 Tab Berjejer)
* **Fakta:** `components/bottom-nav.tsx` menggunakan `grid-cols-6` untuk menjejalkan:
  `[Dashboard, Progres, Kalender, Deliverable, Approvals, Akun]`.
* **Dampak:** Touch target sempit (< 44px di layar kecil), label font `text-[10px]` sangat rapat dan rawan salah tekan (*fat-finger error*).

### 🔴 Masalah 3: Hierarki Tombol Aksi Belum Standar (Tidak Ada Single Primary Action)
* **Fakta:**
  * Di `ApprovalBoard` (`components/client/approval-board.tsx`), setiap kartu memiliki 2 tombol berdampingan dengan ukuran sama:
    * `[XCircle Revisi]` (variant outline, text-destructive)
    * `[CheckCircle2 Approve]` (warna hijau ad-hoc `bg-green-600`)
  * Di `ClientDeliverableDetailPage`, tombol `Setujui`, `Minta Revisi`, `Unduh (.md)`, dan `Kirim Komentar` tersebar tanpa hierarki kontras yang terstandarisasi.
* **Dampak:** *Cognitive load* tinggi; pengguna harus berpikir sejenak untuk membedakan tombol mana yang merupakan aksi utama.

### 🔴 Masalah 4: Header Client Kosong & Terisolasi
* **Fakta:** Header desktop client hanya menampilkan tombol sidebar dan nama aplikasi. Tidak ada breadcrumb, tidak ada theme toggle, dan tidak ada akses profil/logout di bagian atas (logout tersembunyi di footer sidebar atau menu mobile settings).

---

## 3. Fungsi Kritis yang Wajib Dipertahankan 100% (Non-Negotiable)

Semua perombakan visual dan layout **dilarang merusak logic backend & interaksi Supabase berikut**:

1. **Mutasi Persetujuan Postingan:**
   * `PATCH /api/client/approvals` (mengubah status postingan `platform_posts` menjadi `'Approved'` atau `'Draft'` untuk revisi).
2. **Mutasi Persetujuan Deliverable & Komentar:**
   * `POST /api/client/deliverables/[id]/approve` (`deliverables.status = 'approved'`).
   * `POST /api/client/deliverables/[id]/revision` (`deliverables.status = 'revision_requested'` + catatan revisi).
   * `POST /api/client/deliverables/[id]/comments` (insert komentar diskusi).
3. **Ekspor Data:**
   * `/api/client/deliverables/export` & `/api/client/deliverables/[id]/export` (ekspor file Markdown untuk arsip client).
4. **Realtime Updates & Notifikasi:**
   * Komponen `DeliverableNotifier` (`components/client/deliverable-notifier.tsx`) yang mendengar perubahan Supabase realtime pada tabel `deliverables`.
   * Integrasi Telegram (`TelegramConnectCard`, sync chat ID client).
5. **Multi-Tenant RLS Scoping:**
   * Seluruh query Supabase wajib tetap terkunci berdasarkan `users.client_id` (klien Taraju tidak boleh melihat data Pawon Sengon atau data internal admin).
