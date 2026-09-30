# url-state-tables Specification

## Purpose
Mengelola sinkronisasi state tabel data (search query, filter, sort kolom, pagination) secara reaktif ke URL search params menggunakan nuqs tanpa re-render RSC berlebih.

## Requirements

### Requirement: URL-Synced Table Filter State
The system SHALL synchronize table search inputs, status filters, sorting, and pagination parameters to URL search parameters using `nuqs` with `shallow: true`.

#### Scenario: User filters or paginates a table
- **WHEN** the user types a search query, changes page, or selects a status filter
- **THEN** the URL updates immediately without triggering server round-trips or full-page refreshes

### Requirement: Persistent State on Browser Reload
The system SHALL preserve active table filters and pagination state upon browser reload or when sharing the URL.

#### Scenario: User reloads or shares filtered table URL
- **WHEN** the table page is loaded with query parameters present in the URL
- **THEN** the table initializes directly with the exact search query, filters, and page number specified in the URL
