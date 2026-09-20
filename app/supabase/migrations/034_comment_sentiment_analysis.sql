-- Migration 034: Add comment details & sentiment analysis support
ALTER TABLE post_metrics 
ADD COLUMN IF NOT EXISTS comment_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sentiment_summary JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN post_metrics.comment_details IS 'Array of raw comment objects for sentiment/NLP processing';
COMMENT ON COLUMN post_metrics.sentiment_summary IS 'Aggregated sentiment metrics (positive, neutral, negative counts & avg confidence)';
