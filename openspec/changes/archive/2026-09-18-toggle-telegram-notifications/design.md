## Context

Backend notifikasi Telegram sudah lengkap: kolom `telegram_notifications_enabled` ada di tabel `clients` dan `users`, validasi secret token di webhook, gating pengiriman notifikasi, dan endpoint disconnect. Yang belum ada:
- Endpoint untuk mengubah `enabled` tanpa menghapus `chat_id`
- Logika auto-disable saat error 403 di `lib/telegram/service.ts`
- UI toggle di `TelegramConnectCard` (variabel `enabled`, `setEnabled`, `BellIcon`, `BellOffIcon` sudah diimpor tapi tidak dipakai)
- Migrasi SQL formal untuk kolom Telegram (tidak ada file di `supabase/migrations/`)

DESIGN.md root project menentukan: Geist font, Tailwind v4, Animate UI (shadcn-style), `rounded-xl`/`rounded-2xl`, shadow lembut, micro-interaction `scale-95`, warna `#F5F5F7` bg, `#1D1D1F` text, `#0071E3` accent, hijau/kuning status.

## Goals / Non-Goals

**Goals:**
- Menyediakan endpoint `PATCH /api/telegram/preferences` aman (authenticated, role-checked) untuk toggle `telegram_notifications_enabled`.
- Menambahkan deteksi error 403 di `sendTelegramMessage` → auto update DB `enabled = false`.
- Memperbarui `TelegramConnectCard` menampilkan 3-state badge dan tombol toggle notifikasi (Jeda/Aktifkan) menggunakan ikon `BellIcon`/`BellOffIcon` yang sudah diimpor.
- Menghilangkan 4 error ESLint `no-unused-vars` di komponen tersebut secara fungsional.
- Menyediakan migrasi SQL idempotent untuk kolom Telegram.

**Non-Goals:**
- Membuat antarmuka preferensi notifikasi terpisah (mis. granular per event type) — toggle ini bersifat global per akun.
- Mengubah skema notifikasi existing (event types, payload, inline buttons) — hanya menambahkan gating berdasarkan `enabled`.

## Decisions

1. **Endpoint: `PATCH /api/telegram/preferences`**
   - *Alasan:* Hanya memperbarui sebagian field (`enabled`), bukan seluruh resource. `PATCH` semantiknya tepat. Codebase didominasi `POST`, tapi untuk operasi partial update `PATCH` lebih jujur dan tidak menambah pola baru (Server Action) yang tidak ada di codebase (0 Server Action, 40 API route).
   - *Alternatif:* Server Action (ditolak: pola kedua yang tidak perlu), POST ke endpoint baru (ditolak: semantik palsu), numpang endpoint disconnect (ditolak: disconnect menghapus chat_id, toggle mempertahankannya — satu endpoint dua makna).

2. **Auto-disable di `lib/telegram/service.ts` saat error 403**
   - *Alasan:* Kontrak design.md Telegram lama sudah menuliskan mitigasi ini: "menandai status `telegram_notifications_enabled = false` **dan menampilkan peringatan di portal**". Backend sudah jalan (disconnect sudah set false), tapi 403 dari pengiriman normal belum ditangani.
   - *Implementasi:* Tambah parameter opsional `onBlocked?: (recipientType, recipientId) => Promise<void>` ke `sendTelegramMessage`. Jika error response.status === 403, panggil callback untuk update DB. Callback tidak boleh blocking (fire-and-forget) supaya tidak memperlambat respons utama.

3. **3-state badge visual**
   - *Mapping:*
     - `Terhubung` (hijau): `chatId` ada & `enabled = true` → `CheckCircle2Icon`, `bg-emerald-50 text-emerald-700`
     - `Dijeda` (kuning): `chatId` ada & `enabled = false` → `BellOffIcon`, `bg-amber-50 text-amber-700`
     - `Belum Terhubung` (netral): `chatId` tidak ada → `bg-muted text-muted-foreground`
   - *Alasan:* Konsisten dengan sistem status deliverable yang sudah pakai warna + label (bukan warna doang). Kuning/oranye = peringatan/warning, bukan error merah. Ikon `BellOff` sudah diimpor, jadi tidak perlu import baru.

4. **Toggle button placement**
   - Ditaruh di area "Terhubung" (saat `isConnected = true`), di samping tombol "Uji Notifikasi" (admin) dan "Putuskan", dengan variant `outline` size `sm` dan label dinamis "Jeda Notifikasi" / "Aktifkan Notifikasi".
   - *Alasan:* User yang sudah terhubung yang butuh toggle. User belum terhubung tidak perlu tombol ini. Jarak ke tombol "Putuskan" cukup (gap-2) supaya tidak tersentuh salah (Fitts's Law, 44px touch target).

5. **Migrasi SQL idempotent**
   - File: `supabase/migrations/027_telegram_integration_columns.sql`
   - Isi: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT; ADD COLUMN IF NOT EXISTS telegram_username TEXT; ADD COLUMN IF NOT EXISTS telegram_notifications_enabled BOOLEAN DEFAULT true;`
   - *Alasan:* Kolom sudah ada di production tapi tidak terdokumentasikan di repo migrasi. File ini memastikan environment baru (CI, staging, developer baru) tidak gagal saat `supabase migration up`.

6. **Tidak bikin `enabled` state di `telegram-connect-card` dari `useState` local**
   - State `enabled` sudah datang dari prop `initialEnabled` (server-fetched). Toggle akan memanggil API, lalu **refetch** data (atau optimistik update lalu revalidate). Pakai `useState` untuk `enabled` lokal, sinkronkan dengan server via `fetch('/api/telegram/preferences', { method: 'PATCH', ... })`.

## Risks / Trade-offs

- **[Risk]** Race condition: user toggle cepat 2× sebelum request selesai.
  - *Mitigasi:* Disable button saat `isToggling`, debounce 300ms, optimistik update UI dulu lalu rollback kalau gagal.
- **[Risk]** Error 403 terdeteksi tapi callback update DB gagal (mis. RLS, network).
  - *Mitigasi:* Log error, jangan throw. Notifikasi utama sudah gagal kirim, setidaknya backend punya usaha mencatat status. Bisa ditambahkan retry queue nanti (out of scope).
- **[Risk]** User bingung "Dijeda" vs "Putuskan".
  - *Mitigasi:* Label dan tooltip jelas. "Dijeda: notifikasi sementara dihentikan, chat ID tetap tersimpan. Putuskan: hapus koneksi permanen."
- **[Risk]** Migrasi SQL jalan di DB yang sudah punya kolom.
  - *Mitigasi:* `ADD COLUMN IF NOT EXISTS` aman dijalankan berulang (idempotent).

## Migration Plan

1. Propose → Specs → Design → Tasks (sekarang)
2. Implementasi backend (API route + service.ts update + migrasi)
3. Implementasi frontend (TelegramConnectCard)
4. Verifikasi: `tsc --noEmit` + `eslint .` + `next build` (exit 0 semua)
5. Uji manual: connect → toggle → disconnect → auto-disable via 403 (simulasi)
6. Archive change

Rollback: hapus file migrasi, revert API route, revert service.ts, revert komponen. Semua perubahan additive/incremental.

## Open Questions

- Apakah perlu tombol "Coba Kirim Lagi" (re-enable) di status "Dijeda" selain tombol toggle, atau toggle saja cukup? (Saya pakai toggle saja — satu tombol dual-purpose, R-15 CTA spesifik).
- Apakah perlu notifikasi in-app (toast) saat auto-disable terjadi karena 403? (Design.md Telegram non-goal: "Membuat antarmuka chat dua arah penuh... Telegram difokuskan sebagai saluran notifikasi". In-app toast bukan non-goal, tapi out of scope toggle ini).