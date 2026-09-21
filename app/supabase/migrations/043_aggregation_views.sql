-- Performance: aggregation views to collapse repeated per-client rollups.
--
-- Two views, both `security_invoker` so they run under the caller's RLS
-- (Postgres 15+; this project is on 17.6). Without that flag a view is owned by
-- postgres and silently bypasses row-level security.
--
--   metrics_by_client  → post_metrics summed per client (reach, engagement, clicks)
--   dashboard_summary  → deliverables + client_skills rolled up per client
--
-- Apply: Supabase Dashboard → SQL Editor, or Management API database/query.

-- One row per client with their lifetime post metrics.
-- Replaces the client-side reduce over `scheduled_posts → post_metrics` that
-- /admin/dashboard and the ROI board each rebuilt on every load.
CREATE OR REPLACE VIEW public.metrics_by_client
WITH (security_invoker = true) AS
SELECT
  pm.client_id,
  count(*)::bigint                                   AS post_count,
  coalesce(sum(pm.views), 0)::bigint                 AS total_views,
  coalesce(sum(pm.reach), 0)::bigint                 AS total_reach,
  coalesce(sum(pm.likes), 0)::bigint                 AS total_likes,
  coalesce(sum(pm.comments), 0)::bigint              AS total_comments,
  coalesce(sum(pm.shares), 0)::bigint                AS total_shares,
  coalesce(sum(pm.saves), 0)::bigint                 AS total_saves,
  coalesce(sum(pm.clicks), 0)::bigint                AS total_clicks,
  coalesce(sum(pm.wa_inquiries), 0)::bigint          AS total_wa_inquiries,
  coalesce(sum(pm.dm_inquiries), 0)::bigint          AS total_dm_inquiries,
  max(pm.recorded_at)                                AS last_recorded_at
FROM public.post_metrics pm
GROUP BY pm.client_id;

-- One row per client: deliverable status counts and skill progress.
-- Replaces the three separate `.from()` calls plus two Map-reduce loops the
-- dashboard ran to build ClientSummary[].
--
-- Deliverables and client_skills are aggregated in independent subqueries
-- rather than joined side by side: a single query joining both would multiply
-- every deliverable by every skill row and inflate both counts.
CREATE OR REPLACE VIEW public.dashboard_summary
WITH (security_invoker = true) AS
SELECT
  c.id                                  AS client_id,
  c.name                                AS client_name,
  c.contact_email,
  coalesce(d.draft_count, 0)            AS draft_count,
  coalesce(d.sent_count, 0)             AS sent_count,
  coalesce(d.approved_count, 0)         AS approved_count,
  coalesce(d.revision_count, 0)         AS revision_count,
  coalesce(d.deliverable_count, 0)      AS deliverable_count,
  d.last_activity_at,
  coalesce(s.skills_done, 0)            AS skills_done,
  coalesce(s.skills_total, 0)           AS skills_total
FROM public.clients c
LEFT JOIN (
  SELECT
    client_id,
    count(*) FILTER (WHERE status = 'draft')::bigint              AS draft_count,
    count(*) FILTER (WHERE status = 'sent')::bigint               AS sent_count,
    count(*) FILTER (WHERE status = 'approved')::bigint           AS approved_count,
    count(*) FILTER (WHERE status = 'revision_requested')::bigint AS revision_count,
    count(*)::bigint                                              AS deliverable_count,
    max(updated_at)                                               AS last_activity_at
  FROM public.deliverables
  GROUP BY client_id
) d ON d.client_id = c.id
LEFT JOIN (
  SELECT
    client_id,
    count(*) FILTER (WHERE status = 'selesai')::bigint AS skills_done,
    count(*)::bigint                                   AS skills_total
  FROM public.client_skills
  GROUP BY client_id
) s ON s.client_id = c.id;
