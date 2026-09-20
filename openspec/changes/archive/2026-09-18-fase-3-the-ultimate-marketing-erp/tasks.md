# Tasks

## 1. Database Schema & Setup

- [x] 1.1 Create migration for new tables (`events`, `event_tasks`, `event_vendors`, `client_budgets`, `expenses`, `ad_spend_logs`) and verify they apply cleanly to Supabase.
- [x] 1.2 Implement Row Level Security (RLS) policies for the new tables and verify users can only read/write their own client's data.

## 2. Financial Logic & Alerts

- [x] 2.1 Implement database trigger (or Supabase Edge Function) to automatically deduct `expenses` from `client_budgets.remaining_balance` and verify the math is correct on insert.
- [x] 2.2 Expand the Telegram integration to fire an alert when `remaining_balance` drops below 10% (i.e. expenses > 90%) and verify the webhook is triggered.

## 3. UI: Event Workspace

- [x] 3.1 Build the Event Workspace wrapper page and tabs (Rundown, Checklist, Vendors, Post-Mortem) and verify the layout matches the client-specific navigation.
- [x] 3.2 Implement Event Checklist component (Pre/Day-of/Post) and verify checking off items updates the database.

## 4. UI: Marketing Ads Tracker

- [x] 4.1 Create the manual ad spend logging form (Date, Spend, Clicks) and verify it successfully inserts into `ad_spend_logs`.
- [x] 4.2 Build the Trendline Visualization using `recharts` and verify it correctly plots spend vs clicks over time based on logged data.

## 5. UI: Marketing Budget Ledger

- [x] 5.1 Implement the Budget Ledger view allowing admins to set the monthly budget and verify it initializes the `client_budgets` record.
- [x] 5.2 Create the expense logging interface (Amount, Category, Date) and verify it reflects in the ledger list.

## 6. UI: ROI & Executive Dashboard

- [x] 6.1 Build the Executive Dashboard layout and verify it aggregates data from content_items (Fase 1/2) and expenses (Fase 3).
- [x] 6.2 Implement ROI visualizations using `recharts` (Bar charts for Spend vs Output) and verify it accurately reflects the database state.
