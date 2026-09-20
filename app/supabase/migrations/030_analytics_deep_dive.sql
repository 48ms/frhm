-- Migration 030: Analytics Deep Dive Phase 1
-- Adds content_type, creative_format to scheduled_posts and wa_inquiries, dm_inquiries, theme_tag to post_metrics

-- 1. Add columns to scheduled_posts
ALTER TABLE scheduled_posts 
ADD COLUMN IF NOT EXISTS content_type text CHECK (content_type IN ('promo', 'educational', 'entertainment', 'ugc')) DEFAULT 'educational',
ADD COLUMN IF NOT EXISTS creative_format text CHECK (creative_format IN ('reels', 'carousel', 'static', 'story')) DEFAULT 'reels';

-- 2. Add columns to post_metrics
ALTER TABLE post_metrics
ADD COLUMN IF NOT EXISTS wa_inquiries integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS dm_inquiries integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS theme_tag text;

-- 2b. Add columns to analytics_summaries for attribution funnel storage
ALTER TABLE analytics_summaries
ADD COLUMN IF NOT EXISTS total_wa_inquiries integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_dm_inquiries integer DEFAULT 0;

-- 3. Add index for query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_content_type ON scheduled_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_creative_format ON scheduled_posts(creative_format);
