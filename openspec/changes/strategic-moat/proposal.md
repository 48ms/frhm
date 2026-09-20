# Proposal: Strategic Moat — Business & Organizational Layer for Agency Survival

## Why

Frhm functional roadmap (8 changes) delivers *tooling*. Tapi agency premium survive on **strategic moat** — hal-hal yang tool komoditas (Canva, Meta Suite, Notion) tidak bisa replikasikan. 3 layer ini belum disentuh:

1. **Strategic Layer** — Value prop, data moat, quality gate, pricing, micro-value moments
2. **Organizational Layer** — Bus factor elimination, compliance guardrails, offboarding professionalism
3. **Positioning Layer** — Outcome-based pricing, package definition, client tiering

Tanpa ini, Frhm = "tool internal Bima" yang tidak bisa di-scale, di-handoff, atau di-justify fee premium saat kompetitor menawarkan "gratis + template".

## What Changes

**Strategic Layer (New Capabilities):**
- `business/outcome-pricing` — Fee model tied to business metrics (inquiry, revenue), not deliverable count. Includes money-back guarantee logic.
- `business/data-benchmark` — Anonymous cross-client benchmarking (ER, reach, frequency by category) → "Taraju 4.2% vs F&B avg 3.2%".
- `business/quality-gate` — Pre-publish compliance: brand voice score, visual consistency, hook strength, F&B claim checker (BPOM/halal/ITE).
- `business/micro-value-moments` — Owner-facing micro-alerts: "Post kemarin dapat 3 WA inquiry", "Reels viral 2x avg", "Competitor launch detected".
- `business/package-definition` — Starter/Growth/Scale packages with SLA, deliverable caps, revision limits, add-on menu.

**Organizational Layer (New Capabilities):**
- `ops/operator-playbook` — Per-client institutionalized playbook: posting time, hook style, avoid-list, seasonal focus, decision log.
- `ops/ai-cost-governance` — Token budget per client/month, 80% alert, 100% hard stop, usage dashboard.
- `ops/compliance-checklist` — F&B Indonesia specific: BPOM claim validation, UU ITE/Perlindungan Konsumen, Halal claim, keyword risk scanner.
- `ops/client-offboarding` — Export ZIP (assets, metrics, history), handover doc (passwords, access, 3-month calendar), 30-day transition SOP.

**Positioning Layer (Modified Capabilities):**
- `notifications/telegram` — Extend: Owner micro-value moments via WhatsApp (not Telegram admin), celebratory alerts, competitor intel.
- `analytics/client-report` — Extend: Report includes benchmark positioning, quality gate score, compliance status.

## Capabilities

### New Capabilities
- `business/outcome-pricing`: Outcome-based fee model with money-back guarantee logic, inquiry/revenue tracking, package tier enforcement.
- `business/data-benchmark`: Anonymous cross-client benchmarking by category (F&B, coffee, etc.) with percentile positioning per client.
- `business/quality-gate`: Pre-publish quality scoring (voice compliance, visual consistency, hook strength, regulatory claim check) with blocking threshold.
- `business/micro-value-moments`: Automated owner-facing micro-alerts (WhatsApp) for inquiry spikes, viral posts, competitor moves.
- `business/package-definition`: Productized service packages (Starter/Growth/Scale) with SLA, deliverable caps, revision limits, add-on catalog.
- `ops/operator-playbook`: Per-client living playbook (posting time, hook style, avoid-list, seasonal focus, decision log with outcomes).
- `ops/ai-cost-governance`: Token budget per client/month, progressive alerts, hard stops, usage dashboard for operator + admin.
- `ops/compliance-checklist`: F&B Indonesia regulatory guardrails (BPOM, UU ITE, Halal, keyword risk) integrated in publish flow.
- `ops/client-offboarding`: Professional exit: data export ZIP, handover document, transition SOP, alumni relationship tracking.

### Modified Capabilities
- `notifications/telegram`: Add WhatsApp Business API channel for owner micro-value moments; enrich Telegram with celebratory/competitor alerts.
- `analytics/client-report`: Extend monthly report with benchmark positioning, quality gate score, compliance status, package utilization.

## Impact

**Dependencies:**
- `analytics-client-report` complete (report infrastructure, metrics pipeline)
- `analytics-deep-dive` Phase 1 (attribution funnel for inquiry/revenue data)
- External: WhatsApp Business API (for owner micro-alerts), legal review for compliance checklist

**Code Touchpoints:**
- `lib/ai/providers.ts` — add token budget tracking per client
- `lib/telegram/service.ts` — add WhatsApp channel, new alert types
- `lib/compliance/` — new module: BPOM/ITE/Halal keyword scanner + claim validator
- `app/components/publish/` — quality gate UI (score + blocking)
- `app/app/admin/settings/` — package definition, AI budget, playbook editor
- `app/app/client/` — owner micro-value feed (read-only)
- Migrations: `outcome_pricing`, `benchmarks`, `playbooks`, `ai_budgets`, `compliance_rules`, `offboarding_exports`

**Risk:**
- WhatsApp Business API = cost + verification process (start with Telegram fallback)
- Anonymous benchmarking = privacy/legal review (aggregate only, min 5 clients per category)
- Outcome pricing = contract negotiation complexity (start with hybrid: base fee + performance bonus)
- Compliance = legal liability if scanner misses violation (disclaimer: "assist, not guarantee")

**Non-Goals (Explicit):**
- Full legal compliance automation (lawyer still needed)
- Auto-negotiation of contracts
- Client-facing pricing calculator (admin-only for now)
- Internationalization (timezone, multi-currency) — future phase