## Purpose

Establishes who the user is, so that every logged entry has a durable owner and the privacy guarantees in `entry-privacy` have something to attach to.

## ADDED Requirements

### Requirement: Account creation

The system SHALL allow a person to create an account using an email address, without requiring a password.

#### Scenario: New user signs up

- **WHEN** a person submits an email address that has no existing account
- **THEN** the system creates an account and an associated profile
- **AND** delivers a sign-in link to that address

#### Scenario: Email already registered

- **WHEN** a person submits an email address that already has an account
- **THEN** the system delivers a sign-in link rather than reporting an error
- **AND** does not disclose whether the address was already registered

### Requirement: Sign in

The system SHALL authenticate a user via a single-use link sent to their email address.

#### Scenario: Valid link

- **WHEN** a user opens a valid, unexpired sign-in link
- **THEN** the system establishes an authenticated session
- **AND** presents the user's timeline

#### Scenario: Expired or reused link

- **WHEN** a user opens a sign-in link that has expired or already been used
- **THEN** the system refuses to establish a session
- **AND** offers to send a new link

### Requirement: Session persistence

The system SHALL persist an authenticated session across app restarts on the same device, so that a user is not asked to sign in each time they open the app.

#### Scenario: Reopening the app

- **WHEN** a signed-in user closes and reopens the app
- **THEN** the system restores the session without requiring re-authentication

#### Scenario: Session no longer valid

- **WHEN** a stored session has expired or been revoked
- **THEN** the system returns the user to the sign-in screen
- **AND** discards any locally cached account data

### Requirement: Sign out

The system SHALL allow a signed-in user to end their session on the current device.

#### Scenario: User signs out

- **WHEN** a user chooses to sign out
- **THEN** the system ends the session
- **AND** removes locally cached entries and media from the device

### Requirement: User profile

The system SHALL maintain a profile for each account containing at minimum a display name, and SHALL allow the user to edit it.

#### Scenario: Default display name

- **WHEN** an account is created
- **THEN** the system creates a profile with a display name derived from the email address

#### Scenario: Editing the profile

- **WHEN** a user changes their display name and saves
- **THEN** the system persists the change
- **AND** subsequent views show the updated name
