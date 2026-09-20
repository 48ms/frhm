-- Guardrails: the repo's own "what it must do / must never do" sections.
--
-- AGENTS.md pins four ground truths no file may contradict; each skill also carries its own
-- limits in named sections. AGENTS.md, CLAUDE.md and the validator are the repo's rulebook,
-- so they are stored verbatim too — the dashboard renders them instead of paraphrasing.

create table if not exists skill_guardrails (
  skill_id   text not null references skills(id) on delete cascade,
  kind       text not null,   -- scope | done | reads | consent | edge
  heading    text not null,   -- heading exactly as written in SKILL.md
  body       text not null,   -- section body verbatim
  primary key (skill_id, kind)
);

create table if not exists repo_ground_truths (
  key       text primary key,
  source    text not null,   -- file the rule comes from, e.g. AGENTS.md
  rule      text not null,   -- verbatim
  sort_order int not null
);

alter table pipeline_stages add column if not exists publishes boolean default false;
