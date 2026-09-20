## 1. Database Migration

- [x] 1.1 Buat file migrasi `supabase/migrations/027_telegram_integration_columns.sql` dengan `ADD COLUMN IF NOT EXISTS` untuk `telegram_chat_id`, `telegram_username`, `telegram_notifications_enabled` pada tabel `clients` dan `users`. Verifikasi: file dibuat, `supabase migration up --dry-run` tidak error.

## 2. Backend API & Services

- [x] 2.1 Tambah endpoint `PATCH /api/telegram/preferences/route.ts`:
  - Authenticated (createServerClient)
  - Validasi body: `{ enabled: boolean }`
  - Cek otorisasi: user hanya bisa update miliknya sendiri (client_id match atau admin role)
  - Update DB `telegram_notifications_enabled`
  - Return `{ ok: true, enabled: boolean }`
  - Verifikasi: `tsc --noEmit` exit 0, request manual via curl/Postman sukses

- [x] 2.2 Update `lib/telegram/service.ts`:
  - Tambah parameter opsional `onBlocked?: (recipientType: 'client' | 'admin', recipientId: string) => Promise<void>` ke `sendTelegramMessage`
  - Deteksi error HTTP 403 dari Telegram API → panggil `onBlocked` (fire-and-forget, try/catch agar tidak throw)
  - Update TypeScript interface `SendTelegramMessageOptions`
  - Verifikasi: `tsc --noEmit` exit 0, unit test (opsional) memastikan callback dipanggil saat 403

- [x] 2.3 Update pemanggil `sendTelegramMessage` di 5 titik untuk mengirim callback auto-disable:
  - `app/api/admin/deliverables/[id]/send/route.ts`
  - `app/api/client/deliverables/[id]/approve/route.ts`
  - `app/api/client/deliverables/[id]/revision/route.ts`
  - `app/api/cron/publish/route.ts`
  - `app/api/trends/generate/route.ts`
  - Callback: update DB set `telegram_notifications_enabled = false` via service role client
  - Verifikasi: `tsc --noEmit` exit 0, simulasi 403 memicu update DB (dapat ditest dengan mock)

## 3. Frontend Component

- [x] 3.1 Update `components/telegram/telegram-connect-card.tsx`:
  - Gunakan prop `enabled` (dari `initialEnabled`) untuk menentukan 3-state badge: `Terhubung` (hijau, `enabled=true`), `Dijeda` (kuning, `enabled=false`), `Belum Terhubung`
  - Tambah state lokal `isToggling` untuk disable button saat request
  - Tambah fungsi `handleToggleEnabled()`: `PATCH /api/telegram/preferences` → optimistik update UI → rollback kalau gagal
  - Gunakan `BellIcon` (aktif) / `BellOffIcon` (dijeda) di badge dan tombol toggle
  - Tombol toggle label dinamis: "Jeda Notifikasi" (saat enabled) / "Aktifkan Notifikasi" (saat disabled)
  - Tempatkan di area connected, gap-2 dari tombol "Putuskan"
  - Verifikasi: `tsc --noEmit` exit 0, ESLint 0 error di file ini (4 unused-vars hilang), visual check 3 badge state

## 4. Integration & Verification

- [x] 4.1 Update `app/client/dashboard/page.tsx` dan `app/admin/settings/telegram/page.tsx`:
  - Pastikan `initialEnabled` tetap dikirim ke `TelegramConnectCard` (sudah ada, tidak perlu ubah)
  - Verifikasi: tidak ada regresi type

- [x] 4.2 Jalankan full verification loop:
  - `npx tsc --noEmit` → exit 0 ✅
  - `npx eslint .` → exit 0 (0 error) ✅
  - `npx next build` → exit 0 ✅
  - Verifikasi: semua 3 perintah exit 0 ✅

- [ ] 4.3 Uji manual end-to-end:
  - Klien connect → badge "Terhubung" hijau
  - Klien tekan "Jeda Notifikasi" → badge "Dijeda" kuning, ikon BellOff
  - Klien tekan "Aktifkan Notifikasi" → badge kembali hijau
  - Admin connect → sama
  - Simulasi 403 (mock Telegram API return 403) → DB `enabled` jadi false, badge jadi "Dijeda"
  - Disconnect → chat_id null, badge "Belum Terhubung"
  - Verifikasi: semua skenario jalan sesuai spec

## 5. Documentation & Archive

- [ ] 5.1 Update `openspec/specs/notifications/telegram/spec.md` dengan requirement baru (merge delta dari change)
- [ ] 5.2 Jalankan `openspec validate --change toggle-telegram-notifications` → PASS
- [ ] 5.3 Jalankan `openspec archive toggle-telegram-notifications` → change di-archive, spec utama ter-update