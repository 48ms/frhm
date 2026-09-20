# Design

## Context

Fase 3 introduces ERP-level financial and event management capabilities (see `proposal.md`). It requires significant database expansion and integrating financial data with the Telegram notification service.

## Goals / Non-Goals

**Goals:**
- Design a relational schema for tracking monthly budgets, expenses, and ad spend.
- Provide a responsive UI using `recharts` for visualizing ad spend trendlines and ROI dashboards.
- Automate Telegram alerts for budget thresholds securely.

**Non-Goals:**
- Automated direct integration with Facebook/Google Ads APIs (the tracker is explicitly manual logging for zero-budget simplicity).
- Direct payment gateway integration (invoicing/payments are out of scope; this is for internal tracking and client reporting).

## Decisions

### 1. Database Schema Additions
- **Decision:** Introduce specific tables for `events`, `event_tasks` (for checklists), `client_budgets` (storing monthly limit), `expenses` (polymorphic or categorized expenses), and `ad_spend_logs`.
- **Rationale:** Normalizing events away from regular tasks ensures specialized attributes (vendors, rundown times) don't bloat the main `content_items` or `tasks` tables. A dedicated `client_budgets` table allows for historical tracking of past months.
- **Alternatives:** Overloading the `tasks` table with a generic `entity_id`. Rejected because events have vastly different lifecycles and metadata.

### 2. Budget Threshold Alerts
- **Decision:** Use a Supabase Edge Function triggered on `INSERT` to the `expenses` table to check the current budget threshold and send a Telegram webhook if it exceeds 90%.
- **Rationale:** Pushes the notification logic to the backend/database layer, ensuring alerts fire regardless of where the expense was logged (web UI or potential future mobile app).
- **Alternatives:** Triggering the alert from the Next.js frontend route. Rejected because it's less reliable and duplicates logic if multiple endpoints can log expenses.

### 3. Charting Library
- **Decision:** Use `recharts` for all dashboard visualizations.
- **Rationale:** It's lightweight, composable, integrates well with React/Next.js Server/Client components, and offers the necessary line charts (Trendlines) and bar charts (ROI Dashboard) required.

## Risks / Trade-offs

- **[Risk]** Manual Ad Logging errors: Marketers could accidentally input an extra zero, breaking the Trendline and ROI metrics.
  - **Mitigation:** Implement strict validation on the Next.js form and Database constraints for reasonable daily limits, plus provide an easy "Edit/Undo" interface for recent logs.
- **[Risk]** Edge function execution limits or failures when sending Telegram alerts.
  - **Mitigation:** Handle errors gracefully in the Edge Function and log failures to a `notification_logs` table for admin review.
