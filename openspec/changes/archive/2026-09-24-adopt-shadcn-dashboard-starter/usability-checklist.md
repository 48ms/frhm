# Skenario Usability Walk-through: Validasi Dashboard Taraju (Tahap 6)

> Dokumen panduan pengujian antarmuka baru bersama user asli: **Pak Adit (Owner / Decision Maker Brand Taraju)**.

---

## 🎯 Tujuan Pengujian
1. Memvalidasi bahwa Pak Adit dapat langsung mengenali apa yang perlu ia setujui tanpa membaca panduan atau manual.
2. Memastikan pemisahan 3 pilar (Approvals, Kalender, Laporan) menghilangkan kebingungan tab ganda yang sebelumnya terjadi.
3. Memverifikasi bahwa aksi *Setujui Konten* terasa pasti, percaya diri, dan mudah dijangkau dari HP (mobile) maupun laptop (desktop).

---

## 📋 Skenario Uji (Walk-through Checklist)

### Skenario 1: Menemukan Antrean Persetujuan (First-Glance Clarity)
* **Instruksi ke Pak Adit:** *"Pak, coba buka link dashboard di HP atau laptop, lalu lihat apakah ada konten yang perlu Bapak setujui hari ini."*
* **Yang Diamati:**
  * Apakah mata Pak Adit langsung tertuju ke tombol/badge oranye *"X Menunggu"* di header atau tab *Approvals* di bawah?
  * Berapa detik waktu yang dibutuhkan sampai ia tiba di halaman [/client/approvals](file:///c:/Users/bimam/Downloads/Tools%20Frahma/app/app/client/approvals/page.tsx)? (Target: < 3 detik).
* **Catatan Feedback:**
  * `[ ]` Langsung paham tanpa bertanya
  * `[ ]` Ragu-ragu / sempat klik menu lain

---

### Skenario 2: Mengambil Keputusan pada Kartu Konten
* **Instruksi ke Pak Adit:** *"Silakan pilih salah satu kartu konten, cek visual dan caption-nya. Kalau cocok silakan disetujui, atau minta revisi kalau ada yang kurang pas."*
* **Yang Diamati:**
  * Apakah tombol hijau **"Setujui Konten"** terlihat jelas sebagai aksi utama yang diharapkan?
  * Apakah tombol **"Minta Revisi"** mudah ditemukan tanpa membingungkan alur persetujuan?
  * Apakah Pak Adit terbantu dengan tombol mikro **"Salin Caption"** jika ingin membaca di WhatsApp/Notes?
* **Catatan Feedback:**
  * `[ ]` Berhasil melakukan approval dengan percaya diri
  * `[ ]` Ada keraguan saat menekan tombol

---

### Skenario 3: Memeriksa Jadwal Tayang Bulan Ini (Review Content)
* **Instruksi ke Pak Adit:** *"Coba cek jadwal konten yang akan tayang minggu depan di kalender."*
* **Yang Diamati:**
  * Pak Adit mengklik menu **"Kalender"** di bottom navigation atau sidebar.
  * Apakah filter platform (Instagram, TikTok) mudah diganti?
  * Apakah ringkasan angka status ("Total", "Published", "Bulan Ini") mudah terbaca?
* **Catatan Feedback:**
  * `[ ]` Alur navigasi kalender lancar
  * `[ ]` Terjadi kebingungan pada tampilan tanggal

---

### Skenario 4: Evaluasi Ringkasan Kinerja (Laporan)
* **Instruksi ke Pak Adit:** *"Coba buka menu Laporan untuk melihat berapa banyak konten yang sudah selesai diproduksi bulan ini."*
* **Yang Diamati:**
  * Pak Adit mengklik menu **"Laporan"** (`/client/dashboard`).
  * Apakah kartu 4 metrik ringkas mudah dipahami tanpa terasa seperti spreadsheet yang rumit?
* **Catatan Feedback:**
  * `[ ]` Metrik terasa ringkas dan relevan
  * `[ ]` Ada data yang dirasa kurang atau berlebihan

---

## 📝 Format Pencatatan Temuan Lapangan
Jika ada titik di mana Pak Adit bingung atau mengernyitkan dahi:
1. **Titik Halaman / Komponen:**
2. **Komentar Spontan Klien:**
3. **Penyebab (Asumsi vs Realita):**
4. **Tindakan Perbaikan Iteratif:**
