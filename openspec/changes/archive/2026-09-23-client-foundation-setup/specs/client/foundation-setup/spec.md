# Spec Delta: Client Foundation Setup

## ADDED Requirements

### Requirement: File Fondasi Shall Be Listed With Status

The system SHALL display the 5 foundation files with status badges:
- `brand-profile.md` — status: **ada** (if exists), **kosong** (if missing)
- `voice.md` — status: **ada**, **butuh sampel** (if missing), **generate-ready** (if samples exist)
- `audience.md` — status: **ada**, **belum**
- `social-strategy.md` — status: **ada**, **belum**
- `content-pillars.md` — status: **ada**, **belum**

#### Scenario: Brand Profile Exists

- **WHEN** user views Setup tab and `brand-profile.md` exists in `client_files`
- **THEN** badge SHALL show **ada**
- **THEN** action button SHALL be "Edit brand profile"
- **THEN** dialog SHALL open with editor content

#### Scenario: Voice Requires Samples

- **WHEN** user views Setup tab and `voice.md` does not exist
- **THEN** badge SHALL show **butuh sampel**
- **THEN** action button SHALL be "Tambah sampel tulisan"
- **THEN** dialog SHALL contain textarea for paste 3-5 writing samples
- **THEN** button "Buat voice.md dari sampel" SHALL be disabled until textarea has content

#### Scenario: Generate 3 Files Batch

- **WHEN** user clicks "Generate dari brand profile" (only visible when brand-profile exists)
- **THEN** system SHALL call batch endpoint
- **THEN** skill execution SHALL run sequentially: audience → social-strategy → content-pillars
- **THEN** each skill SHALL read `brand-profile.md` before executing
- **THEN** on failure at any step, remaining steps SHALL be skipped
- **THEN** UI SHALL show loading state per file
- **THEN** on success, badge SHALL update to **ada**

### Requirement: Pipeline Stages Shall Show Progress

The system SHALL display the 7 pipeline stages from `pipeline_stages` with progress indicator from `client_skills`.

#### Scenario: Stage Progress Rendered

- **WHEN** user views Setup tab
- **THEN** each stage SHALL show: stage name, icon, skill count, progress bar
- **THEN** progress bar SHALL reflect ratio of completed skills to total skills for that stage
- **THEN** completed stages SHALL have green indicator

### Requirement: Guardrails Shall Be Read-Only Accordion

The system SHALL display guardrails from `skill_guardrails` and `repo_ground_truths` as read-only accordion sections, NOT as editable forms.

#### Scenario: Guardrails Displayed Read-Only

- **WHEN** user expands guardrail accordion
- **THEN** content SHALL be verbatim from `AGENTS.md` (ground truths)
- **THEN** NO edit controls SHALL be present
- **THEN** NO save button SHALL be present

### Requirement: Channel Connection Status Shall Display

The system SHALL display channel connections from `client_channels` with status badges.

#### Scenario: Channel Status Shown

- **WHEN** user views Setup tab
- **THEN** each channel SHALL show: platform name, handle, status badge
- **THEN** status values: **terhubung** (green), **belum** (gray), **gagal** (red)
- **THEN** action button per channel: "Hubungkan" or "Ulangi koneksi"