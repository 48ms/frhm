## Purpose

Kontrak interview skill yang memandu admin memberi tahu AI tentang klien, menampilkan draf dokumen yang sedang disusun secara langsung di panel kanan selama proses berlangsung, dan menjamin bahwa hanya artefak final yang boleh masuk ke workspace klien.

## ADDED Requirements

### Requirement: Interview SHALL Show Live Draft While In Progress

Selama interview berlangsung (`done: false`), sistem SHALL menampilkan draf dokumen parsial yang sedang disusun AI di panel pratinjau, sehingga admin dapat mengamati progres tanpa menunggu interview selesai.

#### Scenario: Draf parsial dirender saat interview berjalan

- **WHEN** AI membalas dengan `done: false` dan menyertakan objek `preview` yang berisi `content` tidak kosong
- **THEN** panel kanan SHALL merender isi `preview.content` sebagai dokumen draf
- **AND** judul panel SHALL menampilkan `preview.title` (fallback ke nama skill bila kosong)
- **AND** badge **"Draf Langsung"** SHALL ditampilkan

#### Scenario: Draf diperbarui setiap giliran

- **WHEN** admin mengirim jawaban berikutnya dan AI mengembalikan `preview` yang lebih lengkap
- **THEN** panel kanan SHALL mengganti draf sebelumnya dengan versi terbaru
- **AND** tidak ada versi draf lama yang ditampilkan bersamaan

#### Scenario: Preview kosong diabaikan

- **WHEN** AI membalas dengan `done: false` tanpa `preview`, atau `preview.content` hanya berisi spasi
- **THEN** sistem SHALL memperlakukan respons sebagai tanpa draf
- **AND** panel kanan SHALL tetap pada keadaan sebelumnya

### Requirement: Partial Draft SHALL NEVER Be Persisted

Draf parsial SHALL bersifat display-only. Sistem SHALL NOT menulis draf parsial ke `client_files` atau `skill_outputs` pada kondisi apa pun selama `done: false`, agar skill hilir yang membaca workspace klien tidak pernah menerima artefak setengah jadi.

#### Scenario: Interview belum selesai

- **WHEN** AI mengembalikan `done: false` beserta `preview`
- **THEN** sistem SHALL NOT melakukan upsert ke `client_files`
- **AND** sistem SHALL NOT melakukan insert ke `skill_outputs`
- **AND** status skill di `client_skills` SHALL tetap tidak berubah

#### Scenario: Field file/output diabaikan saat belum selesai

- **WHEN** AI mengirim objek `file` atau `output` pada respons dengan `done: false`
- **THEN** sistem SHALL mengabaikan objek tersebut dan tidak mempersistensikannya

### Requirement: Finalization SHALL Require Completed Interview

Sistem SHALL hanya mempersistensikan dan memfinalisasi artefak ketika AI menyatakan interview selesai (`done: true`) dan artefak final yang dihasilkannya valid.

#### Scenario: Skill penghasil file workspace

- **WHEN** AI mengembalikan `done: true` dengan `file.content` yang terisi
- **THEN** sistem SHALL menyimpan artefak ke `client_files` dengan path sesuai kontrak skill
- **AND** bila path tidak sesuai daftar tulis skill, sistem SHALL memakai path yang diizinkan skill tersebut
- **AND** status skill SHALL diperbarui menjadi **selesai** di `client_skills`

#### Scenario: Skill penghasil hasil kerja

- **WHEN** AI mengembalikan `done: true` dengan `output.content` yang memenuhi panjang minimum
- **THEN** sistem SHALL menyimpan hasil ke `skill_outputs` dengan status **draft**
- **AND** status skill SHALL diperbarui menjadi **selesai** di `client_skills`

### Requirement: Finalize Action SHALL Appear Only When Artifact Is Ready

Tombol finalisasi SHALL hanya tersedia ketika artefak final sudah ada. Draf parsial SHALL NOT menawarkan aksi simpan.

#### Scenario: Artefak final tersedia

- **WHEN** panel kanan menampilkan `file` atau `output` hasil `done: true`
- **THEN** tombol **"Finalisasi & Simpan"** SHALL terlihat dan dapat diklik
- **AND** tombol edit manual SHALL tersedia untuk penyesuaian sebelum menyimpan

#### Scenario: Hanya draf parsial tersedia

- **WHEN** panel kanan hanya menampilkan `preview` (belum ada `file` maupun `output`)
- **THEN** tombol **"Finalisasi & Simpan"** SHALL NOT ditampilkan

#### Scenario: Penyimpanan berhasil

- **WHEN** admin mengklik "Finalisasi & Simpan" dan penyimpanan berhasil
- **THEN** badge **"Tersimpan"** SHALL ditampilkan
- **AND** daftar skill klien SHALL di-refresh

### Requirement: Preview Panel SHALL Communicate Its State

Panel pratinjau SHALL secara eksplisit mengomunikasikan tiga keadaan agar admin memahami apakah dokumen masih draf, sudah final, atau belum ada.

#### Scenario: Belum ada dokumen

- **WHEN** belum ada `file`, `output`, maupun `preview`
- **THEN** panel SHALL menampilkan keadaan **"Menunggu Dokumen"** dengan petunjuk melanjutkan interview

#### Scenario: Draf parsial berlangsung

- **WHEN** hanya `preview` yang tersedia
- **THEN** panel SHALL menampilkan badge **"Draf Langsung"**

#### Scenario: Artefak final siap

- **WHEN** `file` atau `output` tersedia
- **THEN** panel SHALL menampilkan judul artefak (path file atau judul output)
- **AND** badge draf SHALL NOT ditampilkan

### Requirement: Interview SHALL Start Automatically

Saat skill dibuka, sistem SHALL memulai interview secara otomatis tanpa aksi tambahan dari admin.

#### Scenario: Skill dijalankan

- **WHEN** admin membuka skill dari daftar skill klien
- **THEN** sistem SHALL otomatis mengirim pesan pembuka ke AI
- **AND** interview SHALL berjalan maksimal satu kali per sesi pembukaan skill

### Requirement: Preview Field SHALL Be Backward Compatible

Field `preview` pada respons API SHALL bersifat aditif dan opsional, sehingga tidak mengubah perilaku konsumen yang sudah ada pada route yang dipakai bersama.

#### Scenario: Konsumen lama mengabaikan preview

- **WHEN** sebuah klien memanggil endpoint chat dan tidak membaca field `preview`
- **THEN** perilaku klien tersebut SHALL tetap sama seperti sebelumnya
- **AND** kontrak `file` dan `output` pada `done: true` SHALL tetap tidak berubah
