-- 047_verify_quarterly.sql
-- Repo design principle #6: "Volatile facts are marked — platform specs and tool pricing carry a
-- verify-quarterly flag rather than pretending to be timeless."
--
-- AGENTS.md states it as a house rule: "Never fabricate stats; attribute volatile figures with a
-- verify-quarterly tag." Every skill that quotes a number (reach multipliers, length caps, pricing)
-- writes it inline as `(verify-quarterly)` — the same convention the repo's own SKILL.md files use
-- (e.g. `## The reality (verify-quarterly)`).
--
-- So a stored artefact can be scanned for that literal tag. When it is present, the row is flagged
-- so the dashboard can surface "ada klaim yang perlu dicek ulang tiap kuartal" instead of letting a
-- stale spec look timeless. The tag itself is authored by the AI following the skill text; this
-- column is only the machine-readable echo of it.

ALTER TABLE public.skill_outputs
  ADD COLUMN IF NOT EXISTS needs_verification boolean NOT NULL DEFAULT false;

ALTER TABLE public.client_files
  ADD COLUMN IF NOT EXISTS needs_verification boolean NOT NULL DEFAULT false;

-- When a flagged artefact was last reviewed against current platform specs.
ALTER TABLE public.skill_outputs
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

ALTER TABLE public.client_files
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS skill_outputs_needs_verification_idx
  ON public.skill_outputs (client_id) WHERE needs_verification;

CREATE INDEX IF NOT EXISTS client_files_needs_verification_idx
  ON public.client_files (client_id) WHERE needs_verification;
