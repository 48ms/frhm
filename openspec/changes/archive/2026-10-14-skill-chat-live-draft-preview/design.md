## Context

Lihat [proposal.md](./proposal.md) untuk motivasi. Lihat [specs/client/skill-interview-chat/spec.md](./specs/client/skill-interview-chat/spec.md) untuk requirement.

Kondisi saat ini yang membentuk keputusan:

- `app/app/api/admin/ai/chat/route.ts` adalah **satu route bersama untuk 106 skill**. Ia membaca `SKILL.md` + seluruh workspace klien (`client_files`) dan menyuntikkannya ke system prompt.
- Route mem-parsing output JSON model menjadi `file` (untuk skill yang menulis file workspace) atau `output` (untuk skill yang menghasilkan deliverable), lalu mem-persist ke `client_files` / `skill_outputs` dan meng-update `client_skills.status = 'selesai'`.
- Skill hilir (voice-builder, audience-research, content-pillars, dst.) membaca `client_files` sebagai input. Ini menjadikan **integritas workspace sebagai aturan mutlak repo**.
- UI `skill-chat.tsx` sebelumnya hanya punya 2 keadaan (kosong / final) karena tidak ada sinyal draf parsial dari API.

## Goals / Non-Goals

**Goals**
- Memberi admin umpan balik visual selama interview tanpa mengubah jaminan persistensi.
- Menjaga `file`/`output` sebagai satu-satunya jalur yang menulis ke workspace, tetap digated `done: true`.
- Nol perubahan skema database.

**Non-Goals (design-level)**
- Streaming token-per-token (SSE). Draf tetap per-giliran karena route mengembalikan satu JSON utuh.
- Riwayat/versi draf. Hanya draf terbaru yang disimpan di state klien.
- Perubahan kontrak `file`/`output` yang sudah dipakai 106 skill.

## Decisions

### D1 — Field `preview` terpisah, bukan melonggarkan gate `file`/`output`

**Keputusan**: Menambahkan field baru `preview: { title, content }` yang di-parse **hanya ketika `!out.done`**, alih-alih mengizinkan `file`/`output` parsial.

**Alasan**: Melonggarkan gate `file` akan membuat draf parsial masuk `client_files` → skill hilir membaca artefak setengah jadi → melanggar aturan mutlak repo. Memisahkan field membuat jalur persistensi tetap utuh dan tidak tersentuh.

**Alternatif yang ditolak**:
- *Persist draf ke tabel staging terpisah* → menambah skema & beban cleanup untuk manfaat yang murni kosmetik.
- *Kirim `file` parsial dengan flag `partial: true`* → tetap berisiko; konsumen lama yang tidak memeriksa flag akan menulis draf.

### D2 — Preview di-parse di server, bukan di klien

**Keputusan**: Validasi & normalisasi `preview` (cek `!done`, `content` tidak kosong, fallback `title` ke `skill_id`) dilakukan di `route.ts`.

**Alasan**: Route sudah memiliki logika serupa untuk `file`/`output` (termasuk fallback title ke `skill_id`). Menaruh logika di satu tempat menjaga konsistensi dan mencegah setiap klien mengimplementasikan validasi sendiri.

### D3 — Preview bersifat aditif pada respons JSON

**Keputusan**: Menambahkan `preview` ke objek respons tanpa menghapus field lain.

**Alasan**: Route dipakai bersama 106 skill dan beberapa konsumen. Field aditif aman secara backward-compatible: konsumen yang mengabaikannya tidak berubah perilakunya.

### D4 — State panel kanan: turunan (derived), bukan state terpisah

**Keputusan**: Panel kanan dirender dari kombinasi `file`, `output`, `preview` yang sudah ada. Prioritas render: `file` → `output` → `preview`.

**Alasan**: Menghindari state keempat yang bisa desinkron. Keadaan "Menunggu Dokumen" cukup dinyatakan sebagai `!file && !output && !preview`.

### D5 — Mode edit hanya untuk artefak final

**Keputusan**: `editing` hanya aktif bila `file || output` ada.

**Alasan**: Mengedit draf parsial akan sia-sia karena draf berikutnya akan menimpanya; dan menyimpan draf parsial dilarang oleh spec.

## Risks / Trade-offs

- **[Model tidak konsisten mengirim `preview`]** → Prompt menegaskan kontrak `preview` pada giliran interview (baris 129-131 & 137). Server memvalidasi & mengabaikan `preview` kosong; UI tetap berfungsi tanpa draf.
- **[Prompt JSON salah bentuk]** → Kontrak JSON di prompt diverifikasi manual; `tsc --noEmit` memvalidasi tipe pada sisi TypeScript.
- **[Draf besar membebani payload]** → Draf tetap per-giliran dan hanya ditampilkan; tidak ada persistensi, jadi ukuran tidak menumpuk di database.
- **[Konsumen lain terkejut field baru]** → Field aditif; tidak ada perubahan bentuk pada `file`/`output`/`reply`/`done`.

## Migration Plan

Tidak ada migrasi data. Deploy bersifat kode-saja:

1. Deploy `route.ts` (prompt + parsing + response `preview`).
2. Deploy `skill-chat.tsx` (state + panel 3-keadaan + badge).
3. **Rollback**: kembalikan kedua file ke revisi sebelumnya. Karena tidak ada perubahan skema, rollback tidak meninggalkan data yatim.

## Open Questions

- Apakah admin ingin kemampuan menyimpan draf parsial secara manual (mis. "simpan sebagai catatan")? Saat ini di luar cakupan; dapat diusulkan sebagai change terpisah.
