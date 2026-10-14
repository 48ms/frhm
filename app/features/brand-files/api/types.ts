export interface ClientFile {
  client_id: string
  path: string
  content: string
  updated_at: string
  needs_verification?: boolean
  verified_at?: string | null
}

export interface UpdateClientFileInput {
  clientId: string
  path: string
  content: string
}

export interface VerifyClientFileInput {
  clientId: string
  path: string
}

export interface DeleteClientFileInput {
  clientId: string
  path: string
}

export type BrandFileKey = 'brand-profile.md' | 'voice.md' | 'content-pillars.md' | 'guardrails.md'

export interface BrandFileMeta {
  path: BrandFileKey
  title: string
  shortLabel: string
  description: string
  defaultTemplate: string
}

export const STANDARD_BRAND_FILES: BrandFileMeta[] = [
  {
    path: 'brand-profile.md',
    title: 'Brand Profile & Foundation',
    shortLabel: 'Brand Profile',
    description: 'Identitas inti brand, target audiens, positioning, dan kredibilitas.',
    defaultTemplate: `# Brand Profile

## Who We Are
[Jelaskan entitas bisnis, filosofi, dan nilai inti brand]

## Audience Persona
[Spesifikasikan target audiens, demografi, masalah utama, dan aspirasi]

## Voice & Guardrails
### Tone of Voice
[Karakter gaya bahasa: santai, bersahabat, percaya diri, edukatif]

### Point of View
[Sudut pandang unik brand dalam memandang industri atau solusi]

### Proof & Credibility
- [Pencapaian, sertifikasi, jumlah pelanggan, hasil nyata]

### Do's and Don'ts (Guardrails)
[Larangan umum, pantangan keras, batasan klaim (verify-quarterly)]

## Content Pillars
- Edukasi & Problem Solving
- Brand Story & BTS
- Social Proof & Komunitas
- Promosi & Solusi Produk
`,
  },
  {
    path: 'voice.md',
    title: 'Brand Voice & Tone Guide',
    shortLabel: 'Voice & Tone',
    description: 'Panduan gaya bahasa, register emosi, pemilihan kata, dan larangan frasa klise.',
    defaultTemplate: `# Brand Voice & Tone Guide

## Persona Suara
- **Karakter**: Hangat, berpengetahuan, memberdayakan, tidak menggurui.
- **Register Bahasa**: Kasual profesional, santai bersahabat, sopan dan to-the-point.

## Aturan Gaya Penulisan (Writing Rules)
- Hindari kalimat berbelit-belit dan pembuka klise (e.g. "Di era digital saat ini...").
- Gunakan kalimat aktif dan pemilihan kata konkret yang relatable.
- Dilarang keras menggunakan em dash (—) berlebihan; gunakan koma atau titik.
- Struktur baris pendek dan mudah dipindai di layar ponsel (skimmable).

## Perbendaharaan Kata (Vocabulary)
- **Kata Disukai**: Sahabat, solusi nyata, proses otentik, langkah praktis.
- **Kata Dilarang**: Jargon korporat kaku, klaim absolut tanpa bukti, kata-kata bombastis murahan.
`,
  },
  {
    path: 'content-pillars.md',
    title: 'Content Pillars & Focus Areas',
    shortLabel: 'Content Pillars',
    description: 'Proporsi alokasi pilar konten, breakdown topik mingguan, dan strategi format.',
    defaultTemplate: `# Content Pillars & Focus Areas

## 1. Edukasi & Problem Solving (Alokasi: 40%)
- Solusi praktis terhadap masalah harian audiens.
- Tips actionable tanpa jargon teknis rumit.
- Studi kasus dan bedah kesalahan umum di industri.

## 2. Brand Story & Behind the Scenes (Alokasi: 25%)
- Kisah otentik di balik proses peracikan produk atau operasional harian.
- Profil tim, nilai keberlanjutan, dan dedikasi kualitas bahan.
- Filosofi kenapa brand ini ada dan misi jangka panjang.

## 3. Social Proof & Komunitas (Alokasi: 20%)
- Ulasan jujur pelanggan dan transformasi nyata.
- Sesi Q&A menjawab rasa penasaran pengikut.
- Sorotan interaksi komunitas dan pengguna setia.

## 4. Promosi & Peluncuran (Alokasi: 15%)
- Penawaran spesifik, bundling musiman, atau diskon berkala (verify-quarterly).
- Ajakan bertindak (CTA) jelas tanpa terkesan hard-selling yang mengganggu.
`,
  },
  {
    path: 'guardrails.md',
    title: 'Brand Guardrails & Never-List',
    shortLabel: 'Guardrails & Never-List',
    description: 'Daftar pantangan keras, batasan topik, sensitivitas regulasi, dan protokol krisis.',
    defaultTemplate: `# Brand Guardrails & Never-List

## Pantangan Keras (Hard No)
- DILARANG mengomentari isu politik praktis, sentimen SARA, atau tragedi kemanusiaan untuk promosi konten.
- DILARANG membuat klaim kesehatan atau medis tanpa dasar hasil uji laboratorium valid (verify-quarterly).
- DILARANG menjelekkan kompetitor secara langsung atau menggunakan komparasi negatif.

## Batasan Klaim Finansial & Harga
- Pastikan seluruh harga, diskon, dan ketersediaan stok diverifikasi berkala (verify-quarterly).
- Dilarang menjanjikan keuntungan atau hasil instan tanpa disclaimer realistis.

## Panduan Krisis & Moderasi
- Segera alihkan komplain publik ke jalur WhatsApp / CS resmi secara santun dan cepat.
- Dilarang berdebat di kolom komentar terbuka dengan troll atau akun anonim provokatif.
`,
  },
]
