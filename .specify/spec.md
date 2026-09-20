# Feature Specification: Taraju Client Dashboard MVP

**Feature Branch**: `001-taraju-client-dashboard`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Dashboard berbasis web dimana admin (Bima) mengelola pekerjaan client, dan client (Taraju) hanya bisa melihat, approve, dan kasih feedback/saran terkait yang dikerjakan."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin membuat & mengirim deliverable (Priority: P1)

Sebagai admin, Bima membuat sebuah deliverable (brief, draft konten, atau laporan) dan mengirimkannya ke client agar terlihat di dashboard mereka.

**Why this priority**: Tanpa ini tidak ada apa pun yang bisa direview client — ini fondasi paling dasar dari seluruh alur.

**Independent Test**: Admin membuat satu deliverable baru, mengubah statusnya jadi "terkirim", dan deliverable tersebut muncul di daftar admin dengan status yang benar — bisa diuji tanpa fitur client selesai dulu.

**Acceptance Scenarios**:

1. **Given** admin sedang login, **When** admin mengisi form deliverable baru (tipe, judul, isi) dan menyimpan, **Then** deliverable tersimpan berstatus "draft".
2. **Given** sebuah deliverable berstatus "draft", **When** admin mengubah status jadi "terkirim", **Then** deliverable itu menjadi terlihat oleh client terkait.

---

### User Story 2 - Client approve atau minta revisi (Priority: P1)

Sebagai client, Pak Adit membuka dashboard, melihat deliverable yang dikirim, dan menandainya sebagai "Disetujui" atau "Minta Revisi".

**Why this priority**: Ini inti dari value proposition — client bisa ngasih keputusan tanpa perlu edit apa pun atau bolak-balik chat.

**Independent Test**: Diberikan satu deliverable berstatus "terkirim" milik client tersebut, client bisa menekan Approve atau Minta Revisi dan status berubah sesuai pilihan — bisa diuji begitu US1 selesai, tanpa menunggu fitur komentar (US3).

**Acceptance Scenarios**:

1. **Given** client login dan melihat deliverable berstatus "terkirim", **When** client menekan "Disetujui", **Then** status berubah jadi "approved" dan admin bisa melihat perubahan itu.
2. **Given** deliverable yang sama, **When** client menekan "Minta Revisi", **Then** status berubah jadi "revision_requested" dan kembali terlihat sebagai perlu-dikerjakan di sisi admin.
3. **Given** client login, **When** client membuka daftar deliverable, **Then** client hanya melihat deliverable milik kliennya sendiri, tidak ada milik client lain.

---

### User Story 3 - Komentar dua arah (Priority: P2)

Admin dan client bisa saling menulis komentar pada satu deliverable, membentuk satu thread percakapan yang tetap nyambung.

**Why this priority**: Approve/Minta Revisi saja sering tidak cukup — client biasanya perlu menjelaskan alasan atau saran spesifik, dan admin perlu bertanya balik.

**Independent Test**: Pada satu deliverable, client menulis komentar dan admin membalasnya; keduanya muncul di thread yang sama dengan urutan waktu yang benar — bisa diuji setelah US1 & US2 ada.

**Acceptance Scenarios**:

1. **Given** deliverable terbuka oleh client, **When** client menulis dan mengirim komentar, **Then** komentar tampil di thread dan terlihat oleh admin.
2. **Given** admin membuka deliverable yang sama, **When** admin membalas komentar client, **Then** balasan tampil berurutan sesuai waktu dan terlihat oleh client.

---

### User Story 4 - Admin memantau semua deliverable lewat dashboard (Priority: P3)

Admin melihat daftar seluruh deliverable dalam satu tampilan, bisa difilter berdasarkan status dan tipe.

**Why this priority**: Begitu jumlah deliverable bertambah, admin butuh cara cepat melihat mana yang masih perlu tindakan tanpa buka satu-satu.

**Independent Test**: Dengan beberapa deliverable berbagai status/tipe, admin memfilter berdasarkan status "revision_requested" dan hanya deliverable dengan status itu yang muncul.

**Acceptance Scenarios**:

1. **Given** ada lebih dari satu deliverable dengan status berbeda-beda, **When** admin memilih filter status tertentu, **Then** hanya deliverable dengan status itu yang ditampilkan.

---

### Edge Cases

- Apa yang terjadi jika client mencoba mengakses deliverable milik client lain lewat URL langsung? Harus diblokir di level data (RLS), bukan cuma disembunyikan di UI.
- Bagaimana jika sebuah deliverable berstatus "revision_requested" tidak dikerjakan admin selama berminggu-minggu? Tidak ada eskalasi otomatis di MVP — cukup tetap terlihat di dashboard admin sebagai item terbuka.
- Apa yang terjadi jika admin mengedit ulang deliverable yang statusnya sudah "approved"? Status otomatis reset ke "draft" — client harus approve ulang versi baru, supaya tidak ada perubahan yang diam-diam dianggap "final" tanpa sepengetahuan client.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST membolehkan admin membuat deliverable baru dengan tipe (brief/content/report), judul, dan isi.
- **FR-002**: System MUST membolehkan admin mengubah status deliverable menjadi "terkirim" sehingga terlihat oleh client.
- **FR-003**: Client MUST hanya bisa melihat deliverable milik akun kliennya sendiri.
- **FR-004**: Client MUST bisa menandai deliverable yang berstatus "terkirim" sebagai "Disetujui" atau "Minta Revisi".
- **FR-005**: System MUST membolehkan admin dan client menambahkan komentar pada deliverable, terlihat oleh kedua peran.
- **FR-006**: System MUST menyimpan riwayat lengkap perubahan status dan komentar beserta waktunya untuk setiap deliverable.
- **FR-007**: System MUST mengautentikasi user (admin & client) melalui Google OAuth (Supabase Auth). Role (admin/client) dan client_id TIDAK ditentukan saat login — akun Google baru tidak otomatis punya akses; admin harus mengatur role & client_id secara manual di tabel `users` sebelum akun tersebut bisa mengakses data apa pun.
- **FR-008**: System MUST mencegah client membuat, mengedit, atau menghapus deliverable (hanya baca + approve/komentar).
- **FR-009**: Dashboard admin MUST bisa memfilter deliverable berdasarkan status dan tipe.
- **FR-010**: System MUST mengubah status deliverable kembali menjadi "draft" secara otomatis setiap kali admin mengedit isi deliverable yang berstatus "approved".
- **FR-011**: Admin MUST hanya bisa menghapus deliverable yang masih berstatus "draft"; deliverable yang sudah pernah dikirim (terkirim/approved/revision_requested) tidak boleh dihapus, demi menjaga riwayat tetap utuh.
- **FR-012**: Isi deliverable MUST berupa teks/markdown biasa ditambah satu link eksternal opsional (mis. Google Drive/Canva) untuk gambar atau file; upload file langsung ke sistem di luar cakupan MVP.

### Key Entities

- **Client**: Merepresentasikan Taraju (dan client lain di masa depan); punya nama dan kontak.
- **Deliverable**: Unit pekerjaan yang direview client; punya tipe, status, isi, dan riwayat waktu.
- **Comment**: Pesan yang terikat ke satu deliverable, ditulis oleh admin atau client.
- **User**: Identitas login, terikat ke satu peran (admin/client) dan, jika client, ke satu client_id.

**Catatan terminologi**: Label status yang tampil ke user berbahasa Indonesia (draft, terkirim, disetujui, minta revisi), tapi nilai enum di database memakai bahasa Inggris (`draft`, `sent`, `approved`, `revision_requested`) — pemetaan label ke enum ini harus konsisten dipakai di seluruh UI, jangan campur istilah.

## Out of Scope untuk MVP

- Notifikasi otomatis (email/WhatsApp) saat ada deliverable baru atau status berubah — client & admin cek manual lewat dashboard untuk MVP.
- UI untuk mengelola banyak client sekaligus (data model sudah siap, tapi tampilan admin masih single-client).
- Upload file/gambar langsung ke sistem (lihat FR-012) — cukup link eksternal.
- Billing/invoice.
- Proses offboarding client khusus — kalau perlu, admin cukup mencabut role & client_id user tersebut langsung di database.
- Analitik performa otomatis dari media sosial — angka laporan masih diinput manual oleh admin.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin bisa membuat dan mengirim satu deliverable ke client dalam waktu kurang dari 2 menit.
- **SC-002**: Client bisa approve atau minta revisi pada satu deliverable dalam maksimal 3 klik sejak login.
- **SC-003**: 100% perubahan status dan komentar terlihat oleh kedua peran tanpa perlu sinkronisasi manual lewat WhatsApp/email.
- **SC-004**: Nol kejadian client bisa melihat data client lain (diverifikasi lewat pengujian akses saat multi-client ditambahkan nanti).

## Assumptions

- Taraju adalah satu-satunya client untuk MVP; UI multi-client belum diperlukan tapi data model sudah mendukungnya.
- Client (Pak Adit) punya literasi smartphone/web dasar, tapi lebih suka proses login yang sesedikit mungkin langkah.
- Deliverable yang sudah ada sebelumnya (brief, draft) dimasukkan manual ke dashboard, tidak ada migrasi otomatis.
- Koneksi internet client dianggap cukup stabil untuk web app biasa; tidak perlu mode offline.
