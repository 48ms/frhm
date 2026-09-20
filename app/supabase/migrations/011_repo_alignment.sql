-- Align the skill tables with the real social-media-skills repo.
--
-- The repo is the source of truth: 106 skills, each with SKILL.md + references/ + evals/,
-- grouped by scripts/site-taxonomy.json (14 official groups) and chained by the README into
-- 7 stages. These columns let the UI show the repo's own metadata instead of inferred data.

alter table skills add column if not exists version     text;
alter table skills add column if not exists group_name  text;
alter table skills add column if not exists file_count  int default 0;

-- reads_files / writes_files were guessed earlier; the repo declares them, so re-derive from
-- the SKILL.md text and store the result here. Kept as jsonb for the pipeline gating.
comment on column skills.reads_files  is 'artifact .md files this skill reads (derived from SKILL.md)';
comment on column skills.writes_files is 'artifact .md files this skill writes (derived from SKILL.md)';

-- the exact set of files each skill ships, so the UI can show "SKILL.md + 4 references + evals"
create table if not exists skill_source_files (
  skill_id text not null references skills(id) on delete cascade,
  path     text not null,
  bytes    int  not null default 0,
  primary key (skill_id, path)
);

-- the official 14 groups (scripts/site-taxonomy.json), so Client Setup can mirror the repo site
create table if not exists skill_groups (
  name       text primary key,
  sort_order int  not null,
  stage      text not null
);

-- the repo's 17 topic packs (scripts/packs.json) with their real titles/taglines
alter table skill_packs add column if not exists tagline text;
alter table skill_packs add column if not exists slug    text;
