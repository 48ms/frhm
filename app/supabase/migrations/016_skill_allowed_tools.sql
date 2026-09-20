-- Each skill's declared tool access, straight from its SKILL.md frontmatter.
--
-- skills/scheduling-and-queue/SKILL.md declares:
--   allowed-tools: WoopSocial MCP (Projects, Social Accounts, Posts, Media, Webhooks, Health)
--
-- That declaration is what separates a skill that may ACT on the user's accounts from one that may
-- only advise. The dashboard reads it to decide whether to hand the skill the live bridge tools,
-- so the capability comes from the repo rather than from a hard-coded skill id here.

alter table skills add column if not exists allowed_tools text;

comment on column skills.allowed_tools is
  'SKILL.md frontmatter `allowed-tools`, verbatim. Empty for skills that declare none.';
