# Client Setup ↔ social-media-skills repo

Client Setup is driven entirely by the repo `github.com/social-media-skills/skills`.
Nothing in the UI is hand-invented; every stage, skill id, description and artifact
line is read from the repo and stored in Supabase.

## Install / refresh the repo

The repo is cloned into the workspace next to `app/`:

```
git clone --depth 1 https://github.com/social-media-skills/skills.git social-media-skills
```

To pull upstream changes (skills are added/edited regularly), then re-sync:

```
cd social-media-skills && git pull
cd ../app && python scripts/sync_repo_skills.py
```

`sync_repo_skills.py` truncates and rebuilds every skill table from disk, so the
dashboard can never drift from the repo. It is safe to re-run at any time.

## Where each part of the UI comes from

| UI element | Repo source |
|---|---|
| 14 groups (`skill_groups`) | `scripts/site-taxonomy.json` — the repo's own site grouping |
| 7 stages (`pipeline_stages`) | README "How the skills chain" diagram |
| Stage chain line | `pipeline_stages.chain`, copied verbatim from that diagram |
| Skill order inside a stage | `pipeline_stages.skill_order`, the order the diagram names them |
| 106 skills + descriptions | each `skills/<name>/SKILL.md` frontmatter `name` / `description` |
| 988 skill files | `SKILL.md` + `references/*` + `evals/*`, stored verbatim |
| 17 packs (`skill_packs`) | `scripts/packs.json` |
| reads_files / writes_files | derived from each SKILL.md's own words |

## Artifacts

The repo ships **file-writing skills in Foundation only**. A skill counts as an
artifact writer when its own SKILL.md declares the file it produces
("Produces an `audience.md`", "write the artifact" …) — never hand-listed.

| artifact | writer | read by |
|---|---|---|
| `brand-profile.md` | brand-profile | 30 |
| `voice.md` | voice-builder | 15 |
| `audience.md` | audience-research | 11 |
| `social-strategy.md` | social-strategy | 6 |
| `content-pillars.md` | content-pillars | 1 |

`tools/integrations/*.md` (flux, canva, capcut, woopsocial …) are tool reference
guides, not brand artifacts, so they are excluded from the artifact graph. They are
still embedded under every skill that cites them, in `skill_source_files`.

Every other stage writes prose in the conversation rather than a file — that is the
repo's design, not a gap.

## Repo rules surfaced in the UI

Client Setup shows two layers of rules, both read from the repo:

1. **Aturan repo (jangan dilanggar)** — the five ground truths from `AGENTS.md`, in full:
   publishing routes through the scheduling bridge; the bridge publishes/schedules only (no
   analytics surface, no media generation); one content item per post and a change is
   delete+recreate; **nothing is scheduled, published or deleted without explicit user
   confirmation**; the validator enforces the rest mechanically.
2. **Per-skill "Aturan"** — each skill's own sections, verbatim. `scope` is the "what it must
   never do" section; when a skill has no dedicated scope heading (most format writers), the
   limits are pulled from its own "never / does not" sentences instead, so nothing is invented.

## Running the pipeline

`scripts/run_all_stages.py` walks the stages through the dashboard's own chat API — the UI route
is the thing under test, so nothing re-implements its prompt:

```
python scripts/run_all_stages.py                 # every stage
python scripts/run_all_stages.py --stage plan    # one stage
python scripts/run_all_stages.py --skills 3      # cap skills per stage
```

**The skills are interviews, not one-shot generators.** A skill opens by asking for the brief
(hook-writer asks for format + topic), so a runner must answer and continue until the skill
reports `done`. A single turn proves nothing.

**Model choice matters more than anything else here.** Some 9router models ignore the injected
SKILL.md entirely and reply "which skill do you want to run?" — they look fine on a smoke test
but produce nothing. Test a candidate against a tiny skill before trusting it:

| model | follows the injected skill? |
|---|---|
| `bzl/auto:free` | yes |
| `ollama/gpt-oss:120b` | yes |
| `cbai/glm-5.2`, `cbai/glm-5.1` | **no** — asks which skill to run |
| `gemini/*` | yes, but the free quota 429s quickly |
| `kr/*` (claude-sonnet-4, deepseek-3.2) | monthly limit reached |

## Never let sync destroy client progress

`skills(id)` is referenced by `client_skills.skill_id` **ON DELETE CASCADE**. Deleting or
truncating skill rows therefore wipes every client's pipeline state. The sync snapshots
`client_skills` first and restores it after.

The sync also **refuses to run while a skill is `jalan`** — a concurrent run would snapshot a
half-written state and drop the rows the run is still adding.

## Client channels & the publishing bridge

`supabase/migrations/014_client_channels.sql` and `015_bridge_config.sql`.

- `client_channels` — per client, one row per platform named in `brand-profile.md`. Stores
  status only (`belum` / `terhubung` / `gagal`) plus `confirmed_at`. No credentials, no tokens,
  no account IDs: `tools/integrations/woopsocial.md` says the bridge owns the connection and
  identifiers are "surfaced automatically — discover them, don't ask the user to paste IDs".
- `bridge_config` — one global row holding the WoopSocial API key. Global because one key belongs
  to one WoopSocial account; which clients publish is decided by the projects inside it.
- `lib/bridge/woopsocial.ts` — the client, mirroring `scheduling-and-queue` Step 0 (health →
  discover projects/accounts → OAuth URL → validate → create, confirmation required).
  Verified against the live OpenAPI contract: the OAuth endpoint is
  `POST /social-accounts/authorization-url` (not `.../generate-oauth-url`, which 405s), `platform`
  is the uppercase enum (`INSTAGRAM`, `TIKTOK`, …), `redirectUrl` must be omitted rather than
  blank, and error bodies carry `error_message`.
- `app/api/admin/bridge/*` — status + save-key + per-client connect. The key is write-only:
  it is never returned to the browser.
- `app/admin/settings/bridge` — where the admin pastes the key.
- Client Setup's "Kesiapan Client" card holds a **local copy** of the channel rows, because
  connecting happens in the browser after the server render; a `check` writes the bridge's own
  answer into that copy so the row updates without a reload. Every row keeps a re-check button,
  since an OAuth that completed after the last check would otherwise read as `belum` forever.

Verified: with no key → honest `belum diatur`; with a bad key → the real API's `401` is surfaced;
the key never appears in any response. Confirmation is never stored as a column (AGENTS.md
ground truth 4 — it is per-action, at publish time).

**Publish preconditions (verified against the live API).** `POST /posts/validate` creates nothing
and returns the bridge's own verdict — confirmed by testing it and then listing posts: still empty.
With the connected Instagram account it answered
`{ isValid: false, errors: [{ field: 'MEDIA', message: 'Instagram posts require at least one media
item' }] }`. So Publish has a real precondition the dashboard must surface: **Instagram cannot post
without media**. `listMedia` feeds a media count into the bridge status, and the settings card warns
when the library is empty. Post bodies use their documented shape — `content[]` (one item, per
woopsocial.md), `schedule.type` (`PUBLISH_NOW` / `SCHEDULE_FOR_LATER` / `DRAFT`), and
`socialAccounts[]` carrying `platform` + `socialAccountId` + `postType`.

**Bridge skills get live tools.** The repo declares which skills may *act* rather than advise:
`skills/scheduling-and-queue/SKILL.md` carries `allowed-tools: WoopSocial MCP (Projects, Social
Accounts, Posts, Media, Webhooks, Health)`. `scripts/sync_repo_skills.py` now captures that
frontmatter into `skills.allowed_tools` (migration `016`), and the chat route hands the live bridge
tools to exactly the skills that declare it — the capability comes from the repo, never a
hard-coded skill id.

Before this the skill could only *describe* publishing and would answer "WoopSocial belum terhubung"
even when the bridge was live, because the chat route had no tool access at all. Now it calls
`bridge_status` / `bridge_list_accounts` / `bridge_list_media` / `bridge_validate_post` /
`bridge_create_post` / `bridge_connect_url` (`lib/bridge/publish-tools.ts`) and reports what the
bridge actually returned.

**The confirmation gate is code, not prompt.** `requiresConfirmation()` holds a non-DRAFT
`bridge_create_post` until the *user's own message* contains an explicit yes, and the route checks
it before executing — so a model ordered to "publish now, don't ask" is refused by the server, not
by its own good behaviour. DRAFT is exempt because it publishes nothing. The model is also told
never to claim success without a `postId`, and `bridge_create_post` refuses a platform that is not
connected rather than silently skipping it.

Tool requests use a JSON envelope (`lib/ai/providers.ts`) instead of native function-calling, since
the dashboard runs against whatever OpenAI-compatible endpoint the operator configured and native
tool support varies. The parser scans for balanced JSON objects and uses the first that parses, so a
model emitting two objects in one turn cannot leak the second into the reply. A final turn that
comes back empty triggers one plain retry rather than showing the user a blank bubble.

**Disconnecting an account goes through the bridge, and the handle is cleared with it.** Logging an
account out is `DELETE /social-accounts/{id}` (`disconnectAccount()` in `lib/bridge/woopsocial.ts`),
reached from the "Lepas" button on the client-setup channel row via
`action: "disconnect"` on the connect route. Their contract is explicit that this revokes the OAuth
grant *and* the stored access/refresh tokens, so we never pretend to hold credentials we cannot
revoke — the bridge does the revoking. The UI asks first ("Yakin, lepas") because reconnecting means
the account owner approving again, and the row only flips to `belum` *after* the bridge confirms.

Clearing `handle` alongside `status`/`confirmed_at` is the part that is easy to get wrong: a row
saying `belum` but still showing `@someone` reads as connected and names an account we no longer
publish to. Every path that ends in `belum` — disconnect, a check that finds nothing, and the connect
fallback — must null the handle too. This was caught by testing the disconnect for real rather than
trusting the happy path.

**Verified end-to-end against the live bridge.** A real `PUBLISH_NOW` was executed with explicit
user consent: the bridge returned `deliveryStatus: PUBLISHED` with
`externalPostUrl: https://www.instagram.com/p/DdRDhRlFdqW/`, and Instagram's own page confirmed the
caption and account — so the whole path (skill → tool → bridge → Instagram) is proven, not inferred.
`bridge` and `external` identifiers are reported verbatim; the skill answers "what went out" from
`bridge_list_posts`, never from its own memory.

## Stage gating

Foundation is the gate: a stage opens only when every skill in the stage before it is
done. A skill is done when it is marked `selesai`, or it owns artifacts and all of
them exist. A skill with no artifacts is never "done for free" — `[].every()` is
vacuously true and would unlock everything.

## Tables

Migrated by `supabase/migrations/011_repo_alignment.sql`, `012_stage_chain.sql` and
`013_guardrails.sql`.

- `skills` — id, description, group_name, stage, version, reads_files, writes_files, file_count
- `skill_groups` — the 14 repo groups
- `skill_files` — every file verbatim (read by the skill runner)
- `skill_source_files` — path + byte size manifest of the repo
- `skill_packs` / `pack_skills` — the 17 real packs
- `pipeline_stages` — 7 stages + `chain` + `skill_order` + `publishes`
- `skill_guardrails` — each skill's own rules, verbatim: `scope` (Honest scope / never violate),
  `done` (Definition of done / Quality bar), `reads` (Read these first / Step 0), `edge`, `consent`
- `repo_ground_truths` — the five rules from AGENTS.md
