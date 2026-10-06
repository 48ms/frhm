# 📝 Frahma Pending Tasks & TODOs

## ⏸️ PAUSED: Dashboard Factual Data Migration
**Status:** Menunggu eksekusi skrip SQL di Supabase
**Modul Terkait:** `/admin/dashboard`

**Ringkasan Pekerjaan Tertunda:**
1. Arsitektur *3-layer* (Types, Service, Queries) untuk Dashboard Profile sudah tuntas dibuat (`/features/dashboard/api/*`).
2. Komponen *frontend* (Hero, KPI, Chart) sudah disesuaikan *typing*-nya ke *snake_case* dan *0 type errors*.
3. **BLOKER SAAT INI:** Skrip migrasi `supabase_migration_dashboard.sql` perlu dieksekusi secara manual oleh admin/user di Supabase SQL Editor.
4. **Tindakan selanjutnya jika dilanjutkan:** Pastikan tabel `dashboard_profiles` sudah terbentuk dan terisi dengan *dummy* faktual, lalu lakukan pengecekan langsung ke halaman `/admin/dashboard` untuk verifikasi bahwa data termuat otomatis dari *database*.

---
*(Catatan ini dibuat otomatis oleh agen ECC agar konteks refaktor tidak terputus saat pengerjaan dilanjutkan di masa mendatang)*
