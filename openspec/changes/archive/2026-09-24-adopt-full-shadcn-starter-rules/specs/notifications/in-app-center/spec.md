# Spec Delta: notifications/in-app-center

## Purpose

Menyediakan pusat notifikasi in-app pada header dengan badge jumlah unread, popover preview interaktif (All/Unread/Read), dan fungsi mark as read.

## ADDED Requirements

### Requirement: Header Notification Center Popover
The system SHALL provide an interactive notification popover button in the top navigation header displaying unread notification count badges.

#### Scenario: User clicks notification icon in header
- **WHEN** the user clicks the notification bell button
- **THEN** a popover opens displaying a filterable list of notifications categorized into All, Unread, and Read

### Requirement: Mark as Read and Action Handling
The system SHALL allow users to mark individual or all notifications as read and navigate directly to the relevant content entity upon clicking.

#### Scenario: User clicks an unread notification item
- **WHEN** the user clicks a notification item (e.g. pending approval or new brief)
- **THEN** the item status updates to read, the unread badge count decreases, and the app navigates to the target entity
