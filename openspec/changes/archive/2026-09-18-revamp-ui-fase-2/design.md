# Design

## Context

Lihat `proposal.md` untuk motivasi. Fase 2 ini berfokus pada implementasi komponen UI interaktif untuk Kalender, Analitik, dan Mesin Tren tanpa menyentuh fungsionalitas inti backend. Karena kita sangat bergantung pada `animate-ui` dan `framer-motion`, keputusan teknis akan diarahkan pada performa animasi dan pengalaman sentuh (touch experience) yang solid, terutama di perangkat seluler.

## Goals / Non-Goals

**Goals:**
- Menerapkan fungsionalitas drag-and-drop yang mulus di halaman Kalender Produksi.
- Menambahkan status interaktif (hover/klik) berbasis animasi pada Tabel Analitik.
- Membuat tata letak Masonry untuk halaman Trend Engine.

**Non-Goals:**
- Mengubah skema database atau tabel Supabase.
- Membangun fitur analitik atau metrik baru.
- Menambah kapabilitas pengunduran jadwal otomatis di luar aksi *drag* manual.

## Decisions

**1. Library Drag-and-Drop untuk Kalender**
- *Pilihan*: Menggunakan komponen `Reorder` dari `framer-motion` atau `@dnd-kit/core`.
- *Keputusan*: Karena ini adalah Kalender dua dimensi (bukan sekadar daftar linear), kita akan menggunakan `@dnd-kit/core` dipadukan dengan `framer-motion` untuk *layout animations*. Ini memberikan dukungan aksesibilitas dan deteksi sentuhan (*touch sensors*) yang jauh lebih baik daripada solusi kustom.

**2. Layout Masonry Trend Engine**
- *Pilihan*: CSS Columns, CSS Grid, atau library JS (seperti `react-masonry-css`).
- *Keputusan*: CSS `columns` atau Tailwind `columns-1 sm:columns-2 lg:columns-3` untuk kesederhanaan maksimal tanpa membebani *bundle size*. Komponen kartu di dalamnya akan dibungkus `framer-motion` untuk *entry animations*.

**3. Tabel Analitik Interaktif**
- *Keputusan*: Menghindari library Data Grid eksternal yang berat. Kita menggunakan elemen tabel bawaan Shadcn/UI (`Table`), dibungkus dengan state `framer-motion` (menggunakan properti `layout`) agar baris dapat meluas/mengembang (expand) secara halus ketika diklik untuk melihat detail.

## Risks / Trade-offs

- **Risk**: Konflik gestur *scroll* dengan *drag-and-drop* di layar sentuh (mobile).
  - *Mitigation*: Mengkonfigurasi *activation constraints* pada sensor dnd-kit (misalnya: membutuhkan penundaan sentuhan selama 250ms atau gerakan sejauh 5px sebelum mengaktifkan mode drag).
