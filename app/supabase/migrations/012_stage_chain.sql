-- Stage metadata taken verbatim from the repo's own README "How the skills chain" block,
-- plus the ordered skill chain the repo names for each stage. The dashboard renders this
-- instead of inventing its own copy.

alter table pipeline_stages
  add column if not exists chain text,      -- repo's verbatim "→ a → b → c" line for the stage
  add column if not exists skill_order jsonb;  -- ordered skill ids the repo names for the stage
