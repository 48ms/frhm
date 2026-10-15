## Why

Skill interview adalah cara utama admin "memberi tahu" AI tentang klien (aturan repo: *the agent interviews you*). Tapi selama interview berjalan, admin melihat **panel kanan kosong** — dokumen baru muncul setelah `done: true`. Admin tidak tahu apakah AI benar-benar menangkap jawabannya, sehingga interview terasa seperti kotak hitam dan sering diulang dari awal.

## What Changes

- **Draf Langsung (live draft)**: selama interview (`done: false`) AI boleh mengirim objek `preview: { title, content }` berisi potongan dokumen yang sudah tersusun. Panel kanan merender draf ini **secara real-time**.
- Badge status di header panel kanan: **"Draf Langsung"** (amber, berdenyut) saat draf parsial, **"Tersimpan"** (hijau) setelah finalisasi.
- Panel kanan punya 3 keadaan eksplisit: *Menunggu Dokumen* (kosong) → *Draf Langsung* (parsial) → *Siap Finalisasi* (file/output lengkap).
- Tombol **"Finalisasi & Simpan"** hanya muncul saat artefak final sudah ada (`file`/`output`), tidak pernah untuk draf parsial.
- **Batas keras (non-negotiable)**: `preview` adalah **display-only**. Artefak hanya ditulis ke `client_files`/`skill_outputs` saat `done: true`. Draf parsial **tidak pernah** menyentuh workspace.

## Capabilities

### New Capabilities
- `client/skill-interview-chat`: Kontrak interview skill — AI menanyakan data ke admin, menampilkan draf dokumen live selama proses, dan hanya memfinalisasi artefak saat interview selesai. Mencakup jaminan bahwa draf parsial tidak pernah dipersist ke workspace klien.

### Modified Capabilities
<!-- Tidak ada perubahan requirement pada spec existing. Panel interview belum pernah dispesifikasikan. -->

## Impact

- **Code**:
  - `app/app/api/admin/ai/chat/route.ts` — prompt mengeluarkan kontrak `preview`; response menyertakan field `preview` (display-only, di-parse hanya saat `!done`).
  - `app/app/admin/clients/[id]/skill-chat.tsx` — state `preview`, badge status, panel kanan 3-keadaan, fallback render `preview.content`.
- **Data**: TIDAK ADA perubahan skema. `preview` tidak pernah ditulis ke `client_files` / `skill_outputs`.
- **Kompatibilitas**: Route `api/admin/ai/chat` dipakai bersama oleh 106 skill. Field `preview` bersifat **aditif & opsional**; klien lama yang tidak membacanya tidak terpengaruh. Gate persistensi (`done: true`) tetap utuh, sehingga skill hilir yang membaca `client_files` (voice-builder, content-pillars, dst.) tidak pernah menerima artefak setengah jadi.
- **Non-goals**: streaming token-per-token (draf tetap per-turn), versi draf/history, kolaborasi multi-admin.
