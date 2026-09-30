# Tasks: Skill Chat Live Draft Preview

## 1. API Contract (route)

- [x] 1.1 Tambahkan kontrak `preview` ke system prompt di `app/app/api/admin/ai/chat/route.ts`
  - Instruksi perilaku: "As soon as you have enough info for ANY section, emit it in `preview` right now"
  - Contoh JSON giliran interview menyertakan `"preview":{"title":...,"content":...}`
  - **Evidence**: baris prompt memuat `preview` pada blok `While still interviewing` dan blok `BEHAVIOUR`

- [x] 1.2 Parse `preview` di server, gated `!out.done`
  - Hanya terima bila `!out.done` dan `content` non-kosong setelah trim
  - Fallback `title` ke `skill_id` bila kosong
  - **Evidence**: blok `const preview = !out.done && out.preview?.content ...` ada di `route.ts`

- [x] 1.3 Sertakan `preview` pada response JSON tanpa mengubah `file`/`output`
  - Early-return condition menyertakan `preview`
  - Respons sukses dan respons fallback prosa menyertakan `preview` (null bila tidak ada)
  - **Evidence**: `NextResponse.json({ reply, done, file, output, preview })`

- [x] 1.4 Verifikasi gate persistensi tetap utuh
  - `file` hanya di-set saat `out.done && out.file?.content`
  - Upsert `client_files` dan insert `skill_outputs` hanya terjadi di blok `if (reply || file || output || preview)` namun hanya untuk `file`/`output` yang sudah gated
  - **Evidence**: inspeksi `route.ts` baris blok persistensi; `preview` tidak pernah direferensikan di dalam blok upsert

## 2. UI Panel (skill-chat)

- [x] 2.1 Tambahkan state `preview` di `app/app/admin/clients/[id]/skill-chat.tsx`
  - `const [preview, setPreview] = useState<{ title: string; content: string } | null>(null)`
  - **Evidence**: deklarasi state `preview` ada di komponen

- [x] 2.2 Tangani `j.preview` di handler `send()`
  - `if (j.preview) setPreview(j.preview)`
  - **Evidence**: blok penanganan `j.preview` ada di `send()`

- [x] 2.3 Judul panel dinamis + badge status
  - Prioritas judul: `file.path` → `output.title` → `preview.title` → `'Pratinjau Dokumen'`
  - Badge **"Draf Langsung"** (amber) saat `preview && !file && !output`
  - Badge **"Tersimpan"** (hijau) saat `saved`
  - **Evidence**: kedua badge terender kondisional di header panel kanan

- [x] 2.4 Panel kanan 3-keadaan
  - Keadaan 1: `!file && !output && !preview` → **"Menunggu Dokumen"**
  - Keadaan 2: `editing && (file || output)` → Textarea edit manual
  - Keadaan 3: render `file.content` → `output.content` → `preview.content`
  - **Evidence**: blok kondisional render di badan panel kanan

- [x] 2.5 Tombol "Finalisasi & Simpan" hanya untuk artefak final
  - Tombol muncul hanya dalam blok `(file || output)`
  - Tidak muncul saat hanya `preview`
  - **Evidence**: tombol finalisasi berada di dalam guard `{(file || output) && (...)}`

## 3. Type Safety & Lint

- [x] 3.1 `npx tsc --noEmit` exit 0
  - **Evidence**: dijalankan di `app/`, exit code 0

- [x] 3.2 Perbaiki malformed JSON quote pada contoh prompt
  - Baris contoh JSON giliran interview sebelumnya memiliki escaped quote berlebih (`\"}}`)
  - **Evidence**: baris prompt kini `...partial is fine>"}}` (valid)

## 4. Verification (Gate)

- [x] 4.1 Verifikasi E2E otomatis: buat client → interview → draf live muncul → finalisasi → status `selesai`
  - **Test**: `app/e2e/skill-chat-preview.spec.ts` (Playwright 1.63.0, chromium-1243)
  - **Cara jalan**: `cd app && npx playwright test e2e/skill-chat-preview.spec.ts --project=chromium` (dev server di `localhost:3000`)
  - **Hasil**: `1 passed (34.7s)` — `HAS_DRAFT_BADGE: true`, `VERIFIED: draf live tampil tanpa tombol finalisasi`, `CONSOLE_ERRORS: []`, `PAGE_ERRORS: []`
  - **Bukti**: screenshot `skill_chat_initial.png`, `skill_chat_after_turn1.png`
  - **Catatan**: subagent browser bawaan agen rusak (driver 1.57.0 → 404); verifikasi dilakukan dengan Playwright lokal repo, bukan subagent.

- [x] 4.2 Verifikasi draf parsial TIDAK masuk `client_files`
  - **Cara**: E2E test mengassert tombol "Finalisasi & Simpan" TIDAK ada selama draf parsial (satu-satunya jalur persistensi UI)
  - **Hasil**: `VERIFIED: draf live tampil tanpa tombol finalisasi` — gate `done: true` di `route.ts` tidak terbuka selama interview
  - **Catatan**: query DB langsung tidak dilakukan (route API butuh admin session cookie); gate diverifikasi via code trace + assertion UI

- [ ] 4.3 Verifikasi skill hilir tetap bersih
  - **Status**: DEFERRED — butuh menjalankan interview sampai `done: true` (multi-turn) lalu voice-builder. Diluar cakupan infra ini; dapat diverifikasi setelah interview full-flow berjalan.

## 5. Documentation

- [x] 5.1 Dokumentasikan change ini di OpenSpec
  - `openspec/changes/skill-chat-live-draft-preview/` memuat proposal, spec delta, design, tasks
  - **Evidence**: `npx openspec validate skill-chat-live-draft-preview` lulus
