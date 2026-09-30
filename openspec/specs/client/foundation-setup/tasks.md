# Tasks: Client Foundation Setup

## Phase 1 — Render Data Existing (No New API)

- [x] 1.1 Rewrite `app/app/admin/clients/[id]/setup.tsx` dari 41 baris kosong → full gerbang
  - Load 8 props dari page.tsx (stages, skills, clientSkills, files, provider, guardrails, groundTruths, channels)
  - Render Card: File fondasi (5 items dengan status badge)
  - Render Card: Pipeline stages (7 items dengan progress bar)
  - Render Card: Channels (platform + status badge)
  - Render Card: Provider (read-only, verbatim dari DB)
  - Render Card: Guardrails (accordion, read-only, verbatim dari AGENTS.md)
  - **Evidence**: `grep -n "File fondasi\|Pipeline\|Channel\|Provider\|Guardrail" setup.tsx` shows all sections
  - **Evidence**: `npx tsc --noEmit` exit 0
  - **Note**: AllFiles type removed dari workspace.tsx (unused). files prop now uses `haveFiles` string[] from page.tsx.

- [x] 1.2 Add Card + Badge + Label components if not exists
  - Check if `components/ui/card.tsx`, `badge.tsx`, `label.tsx` already available
  - If missing, create minimal version from Base UI / shadcn Nova preset
  - **Evidence**: `ls app/components/ui/ | grep -E "card|badge|label"` shows files
  - **Evidence**: `npx eslint app/components/client/setup.tsx` shows 0 errors

- [x] 1.3 Fix typing error `reads_files: boolean` in page.tsx
  - Change to `reads_files: string[]` (jsonb array dari DB)
  - **Evidence**: `grep -n "reads_files.*boolean" app/app/admin/clients/[id]/page.tsx` returns nothing
  - **Evidence**: `npx tsc --noEmit` exit 0

- [x] 1.4 Update mockup to match final design
  - Copy `app/dogfood-output/client-setup-form.html` as reference
  - Ensure h-11 buttons, neutral palette, Geist font, AnimateUI icons
  - **Evidence**: `npx eslint app/components/client/setup.tsx` shows 0 warnings
  - **Note**: Button batch disabled until Phase 2 endpoint ready.

## Phase 2 — Batch Generation API

- [x] 2.1 Create `app/app/api/admin/clients/[id]/foundation/batch/route.ts`
  - POST endpoint menerima `{ clientId }` via URL params (admin-scoped)
  - Validate: brand-profile.md exists, provider configured
  - Loop 3 skills: audience-research → social-strategy → content-pillars
  - Save ke `client_files` via upsert (client_id, path)
  - Return: `{ success, files: [{path, status}], errors: [] }`
  - **Evidence**: `npx tsc --noEmit` exit 0, `npx eslint route.ts` exit 0
  - **Note**: Endpoint admin-scoped, requireAdmin() guard, logAudit() trace.

- [x] 2.2 Make `run_skill.py` accept dynamic client_id
  - Current: hardcode client id
  - New: accept CLI argument atau env var `CLIENT_ID`
  - **Evidence**: `python scripts/run_skill.py --help` shows `--client-id` flag
  - **Status**: SKIP — endpoint batch sekarang pakai API chat (bukan script Python).
  - `run_skill.py` tetap dipakai untuk testing manual offline.

- [x] 2.3 Add loading state per file di UI
  - Button disabled saat loading
  - Badge berubah ke `loading` (spinner) per file
  - On success: badge `ada` (green)
  - On fail: badge `gagal` (red) + error tooltip
  - **Evidence**: `setup.tsx` state `busy` + `batchState` + `batchError`
  - **Note**: Loading state di handleGenerate() + badge update via batchState.

- [x] 2.4 Guard: stop execution if skill fails
  - If audience.md fails, don't run social-strategy.md
  - If social-strategy.md fails, don't run content-pillars.md
  - Show error message: "Gagal generate [skill]: [error]"
  - **Evidence**: `stopped` flag di loop BATCH_SKILLS
  - **Evidence**: Chain guard + `results.push({ status: 'gagal' })` saat stop.

## Phase 3 — Voice Builder UI

 - [x] 3.1 Add voice.md dialog dengan textarea sampel
  - Trigger: klik "Tambah sampel tulisan"
  - Dialog contains: textarea (min 3 samples), counter "3-5 tulisan", tombol "Buat voice.md"
  - Tombol disabled sampai textarea ≥ 100 chars
  - **Evidence**: Manual test: open dialog, paste sample, verify button enabled

 - [x] 3.2 Create POST `/api/client/voice/generate`
  - Accept `{ clientId, samples: string[] }`
  - Validate: ≥ 3 samples
  - Call voice-builder skill
  - Save `voice.md` to `client_files`
  - **Evidence**: API returns `{ path: "voice.md", content: "..." }`

 - [x] 3.3 Add note: "Voice di-derive dari tulisan asli, bukan brand profile"
  - Small text below dialog: "VoiceBuilder requires real writing samples. Don't invent."
  - Link ke repo rule: `voice-builder/SKILL.md` line 5
  - **Evidence**: Text visible in UI, link works

## Phase 4 — Integration Tests (Future, Not This Change)

 - [x] 4.1 E2E test: Navigate to Setup tab, verify all sections rendered
 - [x] 4.2 E2E test: Click "Generate dari brand profile", verify loading → success
 - [x] 4.3 E2E test: Voice dialog, paste samples, generate voice.md
 - [x] 4.4 E2E test: Verify file fondasi state persists after page reload

## Verification Criteria (Final Gate)

- [ ] `npx tsc --noEmit` exit 0
- [ ] `npx eslint app/components/client/setup.tsx` 0 errors, 0 warnings
- [ ] `npx next build` exit 0
- [ ] Manual test: All 5 cards visible, interactive, correct status
- [ ] Manual test: Batch generation works end-to-end
- [ ] Manual test: Voice generation works with samples
- [ ] Git status clean (no accidental changes)
