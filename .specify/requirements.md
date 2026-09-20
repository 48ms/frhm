# Requirements Checklist: Taraju Client Dashboard MVP

**Purpose**: Review kualitas requirement di spec.md sebelum lanjut ke plan/tasks
**Created**: 2026-09-13
**Feature**: specs/001-taraju-client-dashboard/spec.md

**Review Ownership**: Checklist ini di-review dan dicentang oleh Bima sendiri sebagai reviewer, sebelum mulai coding.
**Marker Semantics**: `[x]` berarti kriteria kualitas requirement sudah dicek dan terpenuhi — bukan berarti fitur sudah diimplementasi.

## Kejelasan & Tidak Ambigu

- [x] CHK001 Apakah metode autentikasi client sudah ditentukan (tidak lagi NEEDS CLARIFICATION di FR-007)?
- [x] CHK002 Apakah perilaku saat deliverable yang sudah "approved" diedit ulang sudah didefinisikan (edge case di spec.md)?
- [x] CHK003 Apakah hak akses tiap role (admin vs client) sudah jelas untuk SETIAP aksi — create/edit/delete/comment/approve?

## Kelengkapan

- [x] CHK004 Apakah spec membahas apa yang terjadi kalau sebuah client di-nonaktifkan/offboard?
- [x] CHK005 Apakah spec membahas lampiran gambar/file untuk deliverable tipe "content"?
- [x] CHK006 Apakah ekspektasi notifikasi (atau eksklusinya secara eksplisit) sudah didokumentasikan?

## Konsistensi

- [x] CHK007 Apakah definisi entity di spec.md (Client, Deliverable, Comment, User) konsisten dengan data model yang sudah dibahas sebelumnya?
- [x] CHK008 Apakah istilah status deliverable (draft/terkirim/approved/revision_requested) dipakai konsisten di semua FR dan alur approval?

## Testability & Terukur

- [x] CHK009 Bisakah SC-001 sampai SC-004 diverifikasi tanpa penilaian subjektif?
- [x] CHK010 Apakah tiap user story punya independent test yang tidak bergantung pada story lain yang belum selesai?

## Notes

- Centang `[x]` hanya setelah review memastikan kriteria kualitas requirement terpenuhi
- Biarkan tidak dicentang kalau masih butuh klarifikasi atau koreksi
- Semua item sudah diverifikasi terpenuhi per revisi 2026-09-13 — spec.md, plan.md, dan tasks.md sudah konsisten satu sama lain
