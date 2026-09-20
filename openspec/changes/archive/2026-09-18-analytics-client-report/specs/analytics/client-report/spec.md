# Spec Delta

## Purpose

Provides operator-facing monthly client report generation: metrics collection (native SIGNAL only), structured AI insight synthesis, and exportable PDF/Markdown reports that justify agency fee to brand owners.

## ADDED Requirements

### Requirement: Inline Metrics Editing
The system SHALL allow operators to edit post metrics (reach, likes, comments, shares, saves, clicks) directly in the analytics board without modal dialogs, with immediate persistence and audit trail.

#### Scenario: Operator updates a metric inline
- **WHEN** operator clicks a metric cell in the analytics board and enters a numeric value
- **THEN** the value is validated as non-negative integer, saved to `post_metrics` within 500ms, and the UI reflects the new value without page reload

#### Scenario: Invalid input rejected
- **WHEN** operator enters non-numeric or negative value in a metric cell
- **THEN** the cell reverts to previous value and shows an inline validation message "Masukkan angka non-negatif"

### Requirement: CSV and Paste Import for Metrics
The system SHALL accept bulk metrics input via CSV file upload or direct spreadsheet paste (tab/CSV delimiter) mapping columns to `post_metrics` fields.

#### Scenario: Operator pastes spreadsheet data
- **WHEN** operator pastes tab-delimited rows with headers matching `post_id, platform, reach, likes, comments, shares, saves, clicks`
- **THEN** system parses rows, validates each `post_id` exists for the client, upserts `post_metrics`, and reports count of updated vs skipped rows

#### Scenario: CSV upload processes successfully
- **WHEN** operator uploads a CSV file with valid columns
- **THEN** system processes identically to paste, with progress indicator for files >100 rows

### Requirement: Structured AI Insight Generation
The system SHALL generate AI insights using a structured prompt template that compares campaign performance and produces actionable findings for brand owners.

#### Scenario: Operator generates insight for a period and campaign
- **WHEN** operator selects date range, optionally filters by campaign tag, and clicks "Generate Insight"
- **THEN** system constructs prompt with: period totals per campaign, top/bottom 3 posts by engagement rate, week-over-week delta, and instruction "Berikan 3 temuan actionable untuk owner: apa yang work, apa yang tidak, apa yang harus diubah minggu depan"
- **AND** the generated insight is saved to `analytics_summaries` with `period_start`, `period_end`, `campaign_tag`, `ai_insight`, `total_reach`

#### Scenario: Insight generation handles empty data
- **WHEN** no posts exist for the selected period/campaign
- **THEN** system returns "Tidak cukup data untuk insight periode ini" without calling AI provider

### Requirement: Client Report Export (PDF and Markdown)
The system SHALL export a formatted monthly client report containing: executive summary, campaign performance table, top/bottom posts, AI insights, and operator commentary field.

#### Scenario: Operator exports PDF report
- **WHEN** operator clicks "Export PDF" for a client and month
- **THEN** system generates a PDF with Frhm branding, client name, period, and all sections above, downloadable within 10 seconds

#### Scenario: Operator exports Markdown report
- **WHEN** operator clicks "Export Markdown" for a client and month
- **THEN** system generates a `.md` file with same content, suitable for WhatsApp/Notion paste

### Requirement: Weekly Briefing Widget on Admin Dashboard
The system SHALL display a per-client weekly performance briefing on the admin dashboard showing: posts published, total reach, engagement rate, top post, and posts scheduled next week.

#### Scenario: Dashboard loads with briefing data
- **WHEN** admin dashboard loads
- **THEN** for each active client, a briefing card shows: "Minggu ini: 4 post, 12.3K reach, 4.2% ER, Top: 'Buka Puasa Bundling' (3.1K reach). Minggu depan: 3 terjadwal"

### Requirement: Canonical Naming Enforcement
The system SHALL use `content_campaigns` (not `campaigns`), `post_metrics` (not `content_metrics`), and status `sent` labeled as "Terkirim ke Client" (not "Review") in all new code and migrations.

#### Scenario: New code references canonical names
- **WHEN** any new API route, component, or migration references campaign or metrics tables
- **THEN** it uses `content_campaigns` and `post_metrics` exclusively