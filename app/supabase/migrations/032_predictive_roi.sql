-- Migration 032: Predictive Performance & ROI Forecasting (Phase 3)

CREATE TABLE IF NOT EXISTS analytics_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  target_month date NOT NULL,
  forecasted_reach integer DEFAULT 0,
  forecasted_er numeric(5,2) DEFAULT 0.00,
  forecasted_wa_inquiries integer DEFAULT 0,
  forecasted_dm_inquiries integer DEFAULT 0,
  estimated_roi_multiplier numeric(4,2) DEFAULT 1.00,
  confidence_score numeric(3,2) DEFAULT 0.85,
  model_notes text,
  created_at timestamptz DEFAULT now()
);

-- Index for lookup by client and target month
CREATE INDEX IF NOT EXISTS idx_analytics_predictions_client ON analytics_predictions(client_id, target_month);
