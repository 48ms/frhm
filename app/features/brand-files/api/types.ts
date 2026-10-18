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

export type BrandFileKey =
  | 'brand-profile.md'
  | 'voice.md'
  | 'content-pillars.md'
  | 'guardrails.md'
  | 'audience.md'
  | 'social-strategy.md'
  | 'goals-and-kpis.md'
  | 'content-calendar.md'

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
    title: 'Brand Profile & Foundation (10 Kanonikal)',
    shortLabel: 'Brand Profile',
    description: '10 pilar kanonikal upstream: Identity, Positioning, Audience, Voice, Proof, Offers, Channels, Operational Defaults, Guardrails, Show-Don\'t-Tell.',
    defaultTemplate: `# Brand Profile — [Nama Brand]
<!-- version: 1.0 · review: quarterly or on rebrand/pivot · type: [b2b-saas | ecommerce | local | creator] -->

## Identity
- **What it is (one sentence):** [Jelaskan entitas bisnis dalam 1 kalimat lugas yang langsung dipahami orang asing]
- **Category:** [Kategori industri / segmen pasar yang dimasuki]
- **Founded / location:** [Tahun berdiri & lokasi operasional utama]

## Positioning
- **What's different:** [Satu keunikan nyata yang tidak dimiliki alternatif atau kompetitor lain]
- **Why believe it:** [Alasan kredibel mengapa audiens harus percaya]
- **Point of view:** [1–3 keyakinan atau prinsip kuat yang dibela oleh brand]
- **Won't say:** [Narasi atau klaim yang tabu dan dihindari]

## Audience
### Segment 1 — [Segmen Utama]
- **Who:** [Identitas & profesi audiens sasaran utama]
- **Cares about:** [Masalah mendesak & impian/tujuan utama mereka]
- **Believes / objects:** [Keraguan atau resistensi yang biasa mereka miliki]
- **Where:** [Platform sosial tempat mereka paling aktif & pola konsumsi]
- **Sophistication:** [Tingkat pemahaman: Pemula ↔ Pakar]

### Segment 2 — [Segmen Sekunder / Buyer]
- **Who:** [Pembeli pengambil keputusan vs pengikut konten]
- **Transformation:** [Kondisi sebelum ➔ Kondisi setelah menggunakan solusi brand]

## Voice
- **Dimensions:** Formality 2/5 · Warmth 4/5 · Authority 4/5 · Energy 3/5 · Humor 2/5 · Polish 4/5
- **We sound ___, never ___:** [2–4 pasangan kontras, misal: Hangat dan solutif, tidak pernah menggurui atau bombastis]
- **Words we use:** [Kosakata khas, istilah produk, panggilan audiens]
- **Words we ban:** [Jargon klise AI, janji palsu, frasa kaku yang dilarang]
- **How we handle hard things:** [Cara merespons komplain, kenaikan harga, atau kendala teknis]
- **Signature devices:** [Gaya pembuka kalimat, ritme baris, kebijakan emoji & hashtag]
- **Voice by platform:** [Penyesuaian nada: LinkedIn lebih berwawasan, TikTok santai, Instagram visual & hook-first]
- **Pronunciation guide:** [Cara pengucapan nama brand / produk yang benar secara fonetik]

## Proof
- **Numbers:** [Jumlah pelanggan, persentase pertumbuhan, data faktual (verify-quarterly)]
- **Named customers / logos:** [Daftar klien publik, testimoni berizin, mitra strategis]
- **Outcomes / case results:** [Hasil nyata transformasi sebelum vs sesudah]
- **Credentials / track record:** [Tahun pengalaman, penghargaan, sertifikasi resmi]
- **Social proof:** [Rating ulasan, testimoni otentik, ukuran komunitas]
- **Usage rights note:** [Hak penggunaan UGC dan testimoni: izin organik vs iklan berbayar]

## Offers & CTAs
- **Primary CTA:** [Aksi utama yang diharapkan dari audiens, e.g. Hubungi WhatsApp / Kunjungi Toko]
- **Secondary CTAs:** [Aksi ringan: Simpan postingan, bagikan via DM, tinggalkan tanggapan]
- **Lead magnets / offers:** [Penawaran bernilai tinggi, panduan gratis, voucher, atau trial]
- **Hard-sell rules:** [Aturan batas promosi: maksimal 20% dari total kalender postingan]

## Channels
- **Active platforms:** [Instagram, TikTok, LinkedIn, YouTube, X]
- **Posting cadence:** [Target frekuensi post per minggu per platform]
- **Handles / links:** [Akun resmi, website, link-in-bio]
- **Languages / markets:** [Bahasa utama, dialek, atau target demografi geografis]

## Operational Defaults (AI & Media Policy)
- **AI & synthetic media policy:** [Transparansi AI: aturan label AI, apakah avatar diperbolehkan, izin klon suara]
- **Accessibility defaults:** [Alt text pada tiap gambar, video ramah sound-off, kontras warna terbaca jelas]
- **Visual identity pointer:** [Arahkan ke kit desain: logo, palet warna semantik, dan tipografi]

## Guardrails
- **Banned words/topics:** [Daftar topik tabu, isu politik praktis, sentimen provokatif]
- **Compliance / legal:** [Klaim yang membutuhkan disclaimer legal (verify-quarterly)]
- **Competitor rules:** [Aturan penyebutan kompetitor: tidak menjelekkan, fokus pada keunggulan sendiri]
- **Sensitivity:** [SOP penanganan krisis dan batas privasi klien]

## Show, Don't Tell — Example Posts
- **Loves:** [3–5 contoh postingan yang disukai + 1 baris alasan mengapa sangat on-brand]
- **Hates:** [1–2 contoh postingan yang dibenci + 1 baris alasan mengapa melanggar karakter brand]
`,
  },
  {
    path: 'voice.md',
    title: 'Brand Voice & Tone Guide (6-Layer)',
    shortLabel: 'Voice & Tone',
    description: 'Panduan gaya bahasa berbasis bukti nyata dari 6 lapisan dekonstruksi suara upstream.',
    defaultTemplate: `# Brand Voice & Tone Guide
<!-- Derived from real writing evidence · framework: 6-layer deconstruction -->

## The Voice Fingerprint (5–7 Reproducible Signatures)
1. **Ritme Kalimat Dinamis:** [Kombinasi kalimat pendek tegas diikuti satu kalimat elaborasi yang berbobot]
2. **Kosakata Konkret & Nyata:** [Menggunakan contoh empiris dibanding konsep abstrak]
3. **Pembuka Memikat (Hook-First):** [Membuka konten dengan rasa ingin tahu atau fakta tanpa basa-basi]
4. **Sentuhan Empati:** [Mengakui tantangan nyata audiens sebelum menawarkan jalan keluar]
5. **Penutup Satu Aksi:** [Mengakhiri dengan satu aksi jelas tanpa memecah perhatian pembaca]

## The Negative Space (Hard Nevers)
- TIDAK PERNAH menggunakan salam pembuka klise ("Halo kawan-kawan semua", "Di era modern saat ini").
- TIDAK PERNAH membuat klaim bombastis tanpa bukti ("Paling hebat sejagad", "Dijamin kaya instan").
- TIDAK PERNAH menggunakan em-dash (—) berlebihan di setiap kalimat.
- TIDAK PERNAH merendahkan kompetitor atau menyudutkan pembaca.

## The Tone Map (Platform Shifts)
- **LinkedIn:** [Fokus pada wawasan strategis, pembelajaran di balik layar bisnis, dan data industri]
- **Instagram:** [Fokus pada visual kuat, hook penentu di baris pertama, cerita personal, dan materi yang layak disimpan/dibagikan]
- **TikTok:** [Fokus pada gaya bicara santai, ritme dinamis, humor relevan, dan kedekatan komunitas]
- **X / Twitter:** [Fokus pada ketajaman gagasan, ringkas, observasi langsung, dan thread bernilai tinggi]

## Do / Don't Rewrites (3–5 Pasangan)
- **Generic (Don't):** "Kami adalah penyedia solusi terbaik untuk kebutuhan bisnis Anda."
- **On-Voice (Do):** "Alat praktis agar tim Anda menghemat 5 jam kerja rutin per minggu tanpa repot."
- **Why:** Konkret, menyebut manfaat spesifik, dan membuang klaim kosong.

- **Generic (Don't):** "Segera beli produk kami sekarang juga sebelum kehabisan diskon besar!"
- **On-Voice (Do):** "Batch produksi minggu ini tinggal 20 paket. Amankan pesanan Anda sebelum kehabisan."
- **Why:** Alasan kelangkaan yang masuk akal dan tidak terkesan murahan.

## Calibration Anchors (Kutipan Sampel Asli)
- *"[Kutipan 1 dari tulisan atau ucapan asli founder/brand yang menjadi tolok ukur]"*
- *"[Kutipan 2 yang merepresentasikan ritme dan pilihan kata ideal]"*

## Operational Rules for AI & Writers
- Baca panduan ini bersama brand-profile.md sebelum menyusun kalimat apa pun.
- Uji setiap naskah dengan pertanyaan: "Apakah ini terdengar seperti manusia otentik atau AI generik?".
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
  {
    path: 'audience.md',
    title: 'Audience Research & Voice of Customer',
    shortLabel: 'Audience',
    description: 'Profil target audiens, jobs-to-be-done, hambatan psikologis, dan bank kata/kalimat asli audiens.',
    defaultTemplate: `# Audience Research & Voice of Customer
<!-- version: 1.0 · review: quarterly or on audience expansion -->

## Jobs-to-be-Done (JTBD)
- **Primary Job:** [Apa yang ingin diselesaikan audiens dalam kesehariannya tanpa jargon]
- **Emotional Job:** [Bagaimana perasaan yang ingin mereka rasakan atau hindari]

## Pain Points & Objections (Hambatan Nyata)
- [Masalah #1 yang paling sering dikeluhkan dan membuat mereka frustrasi]
- [Keraguan atau skeptisisme utama sebelum memutuskan membeli/percaya]

## Language Bank (Voice of Customer)
- *"[Frasa verbatim asli yang sering diucapkan audiens di komentar/review/DM]"*
- *"[Istilah yang mereka pakai untuk mendeskripsikan kebutuhan mereka]"*
`,
  },
  {
    path: 'social-strategy.md',
    title: 'Social Media Strategy & Platform Choices',
    shortLabel: 'Strategy',
    description: 'Pilihan platform utama, fokus diferensiasi, apa yang sengaja TIDAK dilakukan, dan ritme eksekusi.',
    defaultTemplate: `# Social Media Strategy
<!-- version: 1.0 · review: quarterly -->

## Channel Selection & Roles
- **Primary Channel:** [Nama Platform] — [Peran utama: konversi / edukasi / brand authority]
- **Secondary Channel:** [Nama Platform] — [Peran pendukung]
- **Deliberately Ignored:** [Platform yang sengaja ditinggalkan agar fokus tidak terpecah]

## Winning Angle & Positioning
- [Sudut pandang tajam dan cara brand mendominasi perhatian di platform pilihan]

## Operating Rhythm
- Target posting konsisten mingguan dan alokasi waktu engagement harian.
`,
  },
  {
    path: 'goals-and-kpis.md',
    title: 'Goals, SMART Targets & North Star Metrics',
    shortLabel: 'Goals & KPIs',
    description: 'Target bisnis non-vanity, metrik North Star per channel, dan batas intervensi (NORTH framework).',
    defaultTemplate: `# Goals & North Star KPIs (NORTH Framework)
<!-- version: 1.0 · review: quarterly -->

## Business Objective
- **Core Business Goal:** [Target bisnis riil: leads, revenue, repeat order, authority]

## North Star Metrics per Channel
- **[Channel #1]:** [1 Metrik Utama, misal: Engaged Accounts / Saves / DMs]
- **Benchmark Target:** [Target angka realistis berdasarkan data riil]

## Guardrail Metrics
- [Metrik pelindung agar tidak mengejar vanity metric atau clickbait kosong]
`,
  },
  {
    path: 'content-calendar.md',
    title: 'Content Calendar & Recurring Cadence',
    shortLabel: 'Calendar',
    description: 'Sistem ritme kalender, jadwal slot mingguan berulang per pilar, dan serial konten rutin.',
    defaultTemplate: `# Content Calendar & Recurring Cadence
<!-- version: 1.0 · review: monthly -->

## Recurring Slot Architecture
- **Senin:** [Pilar 1 — Edukasi / Problem Solving]
- **Rabu:** [Pilar 2 — BTS / Brand Story]
- **Jumat:** [Pilar 3 — Social Proof / Testimoni]
- **Minggu (Opsional):** [Pilar 4 — Promo / Community Spotlight]

## Named Recurring Series
- [Nama Rubrik Rutin Mingguan, misal: #BongkarMitos atau #CeritaDapur]
`,
  },
]

