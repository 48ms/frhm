# Tasks

## 1. Setup & Dependencies

- [x] 1.1 Periksa dan instal dependensi `@dnd-kit/core`, `@dnd-kit/sortable`, dan `@dnd-kit/utilities` jika belum ada di `package.json`, lalu pastikan instalasi berhasil.

## 2. Trend Engine Masonry

- [x] 2.1 Refactor halaman Trend Engine agar menggunakan utilitas `columns-1 sm:columns-2 lg:columns-3` dari Tailwind dan bungkus kartu dengan animasi `framer-motion`, lalu verifikasi layout terlihat rapi (masonry) di desktop dan mobile.

## 3. Analytics Board Interactivity

- [x] 3.1 Refactor komponen `analytics-board.tsx` dengan menambahkan animasi transisi status menggunakan `framer-motion` (`layout` property), lalu verifikasi bahwa baris tabel merespons klik/hover secara halus.

## 4. Calendar Drag-and-Drop

- [x] 4.1 Bungkus struktur Kalender (`/admin/calendar`) dengan komponen `<DndContext>` dari dnd-kit beserta *touch sensors* yang tepat, lalu verifikasi inisialisasi dnd-kit tidak memecahkan layout saat ini.
- [x] 4.2 Tambahkan `<SortableContext>` pada kolom tanggal dan bungkus kartu *post* dengan hook `useSortable`, lalu verifikasi bahwa kartu dapat ditarik (*dragged*) melintasi tanggal.
- [x] 4.3 Implementasikan *handler* `onDragEnd` untuk memperbarui *state* tanggal jadwal di sisi frontend dan verifikasi perpindahan kartu melekat pada tanggal target.
