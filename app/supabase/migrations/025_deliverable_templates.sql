-- 025_deliverable_templates.sql
-- Pre-made and custom templates for client deliverables (Brief, Content, Report, Ad Copy)

CREATE TABLE IF NOT EXISTS public.deliverable_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('brief', 'content', 'report')),
  description TEXT,
  content_md TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deliverable_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access deliverable_templates" ON public.deliverable_templates
  FOR ALL USING (public.is_admin());

CREATE POLICY "Client read deliverable_templates" ON public.deliverable_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed standard social media agency templates
INSERT INTO public.deliverable_templates (title, type, description, content_md, is_system) VALUES
(
  'Social Media Content Brief',
  'brief',
  'Brief standar untuk tim kreatif & produksi visual/copywriting.',
  '## 🎯 Campaign Objective
Jelaskan tujuan utama konten ini (Awareness / Consideration / Conversion).

## 👥 Target Audience
- **Demografi:** Usia, Lokasi, Gender
- **Persona & Pain Point:** Masalah spesifik yang dihadapi audiens

## 💡 Key Message
Pesan utama yang harus tersampaikan dalam 3 detik pertama.

## 🎨 Tone & Style
- Tone of Voice: Santai / Edukatif / Elegan / Enerjik
- Visual Reference / Moodboard: [Link Google Drive / Pinterest]

## 📋 Deliverable Output
- [ ] 1x Reels / TikTok (60 detik)
- [ ] 1x Carousel Instagram (5 slides)
- [ ] Story pendukung (3 frames)
',
  true
),
(
  'Instagram Feed / Carousel Copy',
  'content',
  'Format copywriting terstruktur untuk Feed & Carousel.',
  '# [Judul Konten / Headline Hook]

### 🎣 Slide 1 / Hook
Kalimat pembuka yang memicu rasa ingin tahu audiens.

### 📖 Slide 2-4 / Value & Edukasi
- **Poin 1:** Jelaskan fakta menarik atau langkah praktis
- **Poin 2:** Berikan contoh nyata atau studi kasus
- **Poin 3:** Solusi yang ditawarkan brand

### 🚀 Slide Terakhir / Call to Action (CTA)
Simpan postingan ini kalau bermanfaat! Komen "INFO" untuk dapat panduan lengkapnya via DM.

---
### 📝 Caption Copy
Tuliskan narasi lengkap caption di sini dengan gaya bahasa khas brand.

### 🏷️ Hashtags
#SocialMediaMarketing #DigitalStrategy #BrandGrowth
',
  true
),
(
  'Monthly Performance Report',
  'report',
  'Template laporan performa bulanan untuk client.',
  '# 📊 Laporan Performa Bulanan — [Bulan & Tahun]

## 🌟 Executive Summary
Ringkasan performa akun selama 30 hari terakhir dan pencapaian target utama.

## 📈 Key Metrics
| Metrik | Bulan Ini | Bulan Lalu | Pertumbuhan |
|---|---|---|---|
| Total Reach | 0 | 0 | 0% |
| Total Engagement | 0 | 0 | 0% |
| Followers Baru | 0 | 0 | 0% |
| Profile Visits | 0 | 0 | 0% |

## 🏆 Top 3 Postingan Terbaik
1. **[Judul Post 1]** — Reach: XX, Engagement: XX (Alasan sukses: Hook kuat)
2. **[Judul Post 2]** — Reach: XX, Engagement: XX
3. **[Judul Post 3]** — Reach: XX, Engagement: XX

## 🔍 Evaluasi & Insight AI
- Apa yang berjalan efektif bulan ini
- Apa yang perlu diperbaiki atau dihentikan

## 🎯 Rencana Strategis Bulan Depan
1. Eksplorasi format video pendek bertema studi kasus
2. Penyesuaian jam tayang postingan utama
3. Kolaborasi aktivasi dengan komunitas mikro
',
  true
)
ON CONFLICT DO NOTHING;
