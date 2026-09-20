-- Migration 035: Add scheduling & publishing support for Content Intelligence Suite
ALTER TABLE scheduled_posts 
ADD COLUMN IF NOT EXISTS external_post_id TEXT,
ADD COLUMN IF NOT EXISTS publishing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_publish_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS publish_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS caption_suggestion TEXT;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_publishing_status ON scheduled_posts(publishing_status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);

COMMENT ON COLUMN scheduled_posts.external_post_id IS 'Post ID returned by social media platform after successful publish';
COMMENT ON COLUMN scheduled_posts.publishing_status IS 'Current state: pending/scheduled/publishing/published/failed/cancelled';
COMMENT ON COLUMN scheduled_posts.last_publish_attempt IS 'Timestamp of last attempt to reach platform API';
COMMENT ON COLUMN scheduled_posts.publish_retry_count IS 'How many times publish was retried due to transient errors';
COMMENT ON COLUMN scheduled_posts.caption_suggestion IS 'Suggested caption provided by AI Caption Generator';