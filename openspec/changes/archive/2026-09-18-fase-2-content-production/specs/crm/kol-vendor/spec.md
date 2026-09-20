# Spec Delta

## Purpose
Provides a mini-database (CRM) for managing Key Opinion Leaders (KOLs) and vendors, including their rate cards, niches, and collaboration histories.

## ADDED Requirements

### Requirement: KOL/Vendor directory
The system SHALL maintain a searchable directory of KOLs and vendors, storing metadata such as name, contact info, niche/specialization, and current rate card.

#### Scenario: Searching for a KOL
- **WHEN** a user searches the CRM for "Beauty"
- **THEN** the system displays a list of KOLs categorized under the Beauty niche, along with their baseline rates

### Requirement: Collaboration history
The system SHALL display the history of past campaigns and deliverables associated with a specific KOL or vendor.

#### Scenario: Viewing KOL details
- **WHEN** a user opens a KOL's profile
- **THEN** the system lists all previous deliverables where this KOL was involved, including the client name and campaign date
