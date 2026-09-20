# Spec Delta

## Purpose
Tracks monthly expenses per client (KOL, Ads, Events) against a defined budget, acting as a financial ledger.

## ADDED Requirements

### Requirement: Client Budget Allocation
The system SHALL allow admins to set a monthly marketing budget for each client.

#### Scenario: Admin sets monthly budget
- **WHEN** an admin inputs a budget amount for the current month
- **THEN** the system sets the client's starting balance to that amount

### Requirement: Expense Deduction
The system SHALL automatically deduct logged expenses (ads, KOL payments, event costs) from the client's monthly budget.

#### Scenario: Expense is logged
- **WHEN** an expense is recorded in the system
- **THEN** the client's remaining budget balance is decreased by the expense amount
