# Panduan Integrasi Menyeluruh Animate UI di FRHM SaaS Dashboard

Dokumen ini mendefinisikan langkah migrasi dan standardisasi komponen interaktif di aplikasi FRHM agar sepenuhnya mengadopsi standar animasi **Animate UI** (Motion + Tailwind CSS + Radix/Base UI).

---

## 1. Arsitektur & Prinsip Animasi (Animate UI)

- **Engine Dasar**: `motion/react` (Motion v12+)
- **Pendekatan Registry**: Open-code (komponen di-manage langsung di `components/ui/` dan `components/animate-ui/`)
- **Prinsip Gerak**:
  - *Spring Physics*: `{ type: "spring", stiffness: 300, damping: 25 }` untuk respons klik/tap.
  - *Micro-Interactions*: Scale feedback `tapScale: 0.98`, `hoverScale: 1.01`.
  - *Entri/Keluar Modal*: Smooth scale + blur fade (`scale: 0.95 -> 1.0`, `opacity: 0 -> 1`).

---

## 2. Rencana Migrasi Komponen (Fase Demi Fase)

### Fase A: Button & Micro-Interactions
- Mengubah `components/ui/button.tsx` menjadi Animated Button (`motion.button`).
- Menambahkan props `hoverScale` dan `tapScale` yang aktif secara bawaan untuk semua tombol interaktif dashboard (`+ New Post`, `Quick Export`, dsb).

### Fase B: Modals & Dialogs (Presisi Animate UI)
- Memperbarui `components/ui/dialog.tsx` dan `components/ui/alert-dialog.tsx`:
  - Backdrop menggunakan fade transparan dengan efek `backdrop-blur-sm`.
  - Konten Dialog menggunakan transisi pegas (spring) khas Animate UI (`stiffness: 260, damping: 20`).
  - Menghilangkan *layout pop-in* menggunakan `AnimatePresence`.

### Fase C: Form & Input Interactivity
- Input focus glow dan label float berbasis Motion.
- Checkbox dan Toggle Switch dengan micro-spring saat pergantian state (aktif/non-aktif).

### Fase D: Animated Icons
- Integrasi ikon dengan transisi rotasi/skala halus saat status berubah (misalnya: refresh sync, expand accordion, delete button).

---

## 3. Komponen Target Utama

1. `components/ui/button.tsx` -> Diganti dengan Motion Button bertekstur Animate UI.
2. `components/ui/dialog.tsx` -> Spring-loaded Modal Dialog.
3. `components/campaigns/campaign-modal.tsx` -> Mengadopsi animasi dialog terpadu.
4. `components/calendar/post-dialog.tsx` -> Full spring transitions pada panel form.
5. `components/dashboard-stitch/ai-hook-modal.tsx` -> Menggunakan Animate UI Dialog Popup.
