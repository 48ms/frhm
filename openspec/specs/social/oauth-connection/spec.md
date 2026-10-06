# Capability: oauth-connection

## Purpose

Manages the OAuth lifecycle for client social media accounts, including connection, profile synchronization, and error auditing via Ayrshare bridge.

## Requirements

### Requirement: Full platform support
The system SHALL permit clients to connect all social platforms supported by Ayrshare (Instagram, TikTok, YouTube, LinkedIn, Twitter, Facebook).

#### Scenario: User opens connection modal
- **WHEN** user clicks "Connect account" in the social accounts board
- **THEN** all supported platforms are shown as available and clickable

### Requirement: Real-time profile synchronization
The system SHALL fetch the latest avatar and handle directly from Ayrshare using the client's profile key when connecting or refreshing an account.

#### Scenario: User refreshes account data
- **WHEN** user invokes the sync action for a channel
- **THEN** the system queries the Ayrshare API directly and updates the local handle, avatar_url, and status

### Requirement: Resilient OAuth error handling
The system SHALL intercept OAuth errors from the provider, log them to the audit trail, and display a user-friendly error message.

#### Scenario: User cancels OAuth authorization
- **WHEN** the callback receives an error query parameter indicating user cancellation
- **THEN** the system records an audit log for the failed attempt and redirects the user with a parsed error message
