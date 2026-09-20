# Bulk Skill Execution

Run many skills in one go instead of one-by-one through chat. Admin selects skills, gives an
optional shared brief, and the results land in the **Hasil** tab ready to send to the client.

## Where

`Admin → Client → Skill tab → "Pilih Banyak"` → tick skills → `"Jalankan N skill"`.

- **Pilih Banyak** toggles selection mode (checkboxes + per-pack "Pilih semua").
- **Pilih yang belum (N)** selects every unfinished skill at once — the fast path.
- **Kosongkan** clears the selection; **Batal** leaves selection mode.
- Running a completed skill again is safe: it appends a new output, the old one stays.

## How it works

`POST /api/admin/clients/[id]/skills/bulk-run` with `{ skill_ids: string[], brief?: string }`.

1. Resolves each skill from the `skills` table (name, description, stage).
2. Builds a context block from the client's `brand_profile` + the optional brief.
3. Calls the configured AI provider once per skill, **sequentially** (rate limits, no thundering herd).
4. Writes a row into `skill_outputs` (`stage` taken from `skills.stage`).
5. Flips `client_skills.status` to `selesai` for each skill that succeeded.
6. Returns `{ results: [{ skill_id, ok, error? }] }` so the dialog shows per-skill outcome.

Failures do not abort the batch — one bad skill reports `ok: false` and the rest continue.

## Two bugs fixed while building this

**Skills with no pack link were invisible.** `skillsByPack` was built from `pack_skills`
(junction). A skill installed directly on a client without a pack link never rendered, so it
could not be run or counted. Fix in `page.tsx`: collect `client_skills` rows whose skill has no
pack link and surface them under a synthetic **"Tanpa Paket"** pack. On Taraju this revealed 29
hidden skills.

**Skills in several packs were rendered once per pack.** 152 `pack_skills` rows over 106 skills
meant the list showed 181 rows, and the "N dipilih" badge (4 unique ids) disagreed with the
number of ticked checkboxes. Fix in `skills.tsx`: dedupe in `activeByPack` — first pack wins.
Also made `allSkillIds` read from `client_skills` (source of truth), not from what rendered.

## Verification

- 106 rows render, 18 packs (17 real + Tanpa Paket), badge count == ticked checkboxes.
- Ran 4 pending skills → `4 berhasil · 0 gagal`, `skill_outputs` 10 → 14, `client_skills`
  106/106 `selesai`, pipeline shows every stage complete.
- Re-ran 2 completed skills → appended, old outputs preserved.

## Port note

The dev server for this app runs on **:3001**. Port :3000 is a different project (Bima CRM)
owned by the user — never kill or restart the process holding it.
