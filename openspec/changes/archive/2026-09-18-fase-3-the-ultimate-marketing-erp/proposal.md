# Proposal

## Why

This proposal covers Fase 3 of the Frhm roadmap: "The Ultimate Marketing ERP". This phase transforms the application from a task-management and content-production tool into a complete Enterprise Resource Planning (ERP) platform for digital marketing agencies. It introduces financial tracking, event management, and executive ROI reporting, solving the problem of disconnected financial ledgers and providing clients with transparent proof of value (spend vs. output).

## What Changes

- Introduce a dedicated Event Workspace for end-to-end event management, separate from standard tasks.
- Build a Unified Ads Tracker for smart manual logging of ad spend and performance metrics.
- Implement a Marketing Budget Ledger per client that tracks expenses and deducts from a monthly balance.
- Integrate Telegram alerts to notify when the client budget reaches critical thresholds (e.g., 90%).
- Create an ROI & Executive Dashboard to correlate financial spend from Fase 3 with the content outputs from Fase 1 & 2.

## Capabilities

### New Capabilities
- `management/event-workspace`: Dedicated workspace for events including rundown, checklists, vendors, and post-mortem evaluation.
- `marketing/ads-tracker`: Smart manual logging system for ad spend and clicks with automatic trendline visualization.
- `marketing/budget-ledger`: Monthly ledger per client tracking expenses (KOL, Ads, Events) with automated balance deduction.
- `client/roi-dashboard`: Executive dashboard correlating spend with content and views generated.

### Modified Capabilities
- `notifications/telegram`: Add new alerts for critical budget thresholds (e.g., 90% budget utilization).

## Impact

- **Database**: Significant schema additions for `events`, `ad_spend_logs`, `client_budgets`, and `expenses`.
- **UI**: New high-level dashboards and detailed workspaces.
- **Integrations**: Existing Telegram notification system will be expanded to handle financial alerts.
- **Workflow**: Agency members will begin logging financial data, shifting the system to a true ERP.
