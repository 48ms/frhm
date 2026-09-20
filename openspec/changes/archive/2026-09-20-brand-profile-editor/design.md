# Design: Brand Profile Editor

## Context
Setelah AI men-generate `brand-profile.md` saat onboarding singkat, admin sering kali perlu menyempurnakan detail seperti alokasi persentase pilar konten, guardrails (Do's & Don'ts), target audience, dan deskripsi brand tanpa harus mengedit markdown mentah secara manual.

## Architecture & Data Flow

```
[Tab Foundation] -> Klik "Edit Brand Profile"
       │
       ▼
[BrandProfileEditor Dialog]
  ├── Parser: Parse string markdown `brand-profile.md` menjadi structured object:
  │     - whoWeAre (summary text)
  │     - audience (demographics, pain points, desires)
  │     - voice (tone, dos[], donts[])
  │     - pillars (array of { name, percentage, subtopics[] })
  │     - channels (array of string)
  │     - brandAssets (colors[], fonts, assets)
  │
  ├── UI Sections:
  │     1. Summary & Identity
  │     2. Audience & Pain Points
  │     3. Content Pillars (Slider + Subtopics + Validation total 100%)
  │     4. Voice & Guardrails (Tags input Do's / Don'ts)
  │
  └── Serializer: Merakit kembali structured object menjadi markdown string valid
       │
       ▼
[API: PUT /api/admin/clients/[id]/files/brand-profile] -> upsert `client_files`
       │
       ▼
Refresh Client Workspace State
```

## UI/UX Rules (Antislop & Design Guide)
- Modal dialog lebar responsif (`max-w-3xl`) dengan scroll internal
- Indikator total persentase pilar: hijau jika 100%, kuning/merah jika != 100%
- Tombol simpan disabled jika total persentase != 100%
- Tag-based input untuk Do's, Don'ts, dan Subtopics (bisa tekan Enter / tombol tambah)
- Menggunakan komponen shadcn: Dialog, Button, Input, Textarea, Slider/Badge
