## Purpose

Guarantees that everything a user logs is private unless they deliberately decide otherwise, and that this guarantee holds identically for every module without each one having to implement it.

## ADDED Requirements

### Requirement: Private by default

Every entry, item, place, and media object SHALL be private to its owner at the moment it is created. No module capture flow SHALL be able to create a record that is visible to anyone else by default.

#### Scenario: Newly created entry

- **WHEN** a user creates an entry through any module
- **THEN** the system stores it with visibility `private`

#### Scenario: Module cannot opt out of the default

- **WHEN** a module's capture flow omits a visibility value
- **THEN** the system applies `private`

### Requirement: Visibility is a core attribute

Every entry SHALL carry a visibility of `private`, `friends`, or `public`, held as a core attribute of the entry rather than within any module's payload.

#### Scenario: Changing visibility

- **WHEN** an owner changes an entry's visibility
- **THEN** the system persists the new value
- **AND** the entry's detail view indicates its current visibility

#### Scenario: Uniform across modules

- **WHEN** entries from different modules are compared
- **THEN** each carries visibility in the same form, with the same permitted values

### Requirement: Access is enforced by the storage layer

The system SHALL enforce access control at the data layer, such that a request for records the requester is not entitled to returns no data regardless of which module or screen issued it.

#### Scenario: Owner reads own records

- **WHEN** a signed-in user requests their own entries
- **THEN** the system returns them irrespective of visibility

#### Scenario: Another user's private entry

- **WHEN** any request is made for an entry owned by a different user with visibility `private`
- **THEN** the system returns no data for that entry

#### Scenario: Unauthenticated request

- **WHEN** a request for any entry is made without an authenticated session
- **THEN** the system returns no data

#### Scenario: Enforcement does not depend on module code

- **WHEN** a module issues a query that omits an ownership filter
- **THEN** the system still returns only records the requester is entitled to

### Requirement: Attached content inherits entry access

Media, item references, and place references attached to an entry SHALL be no more accessible than the entry itself.

#### Scenario: Media on a private entry

- **WHEN** a request is made for a media object attached to another user's private entry
- **THEN** the system denies access to that media

#### Scenario: Media access requires authorization

- **WHEN** a media object's storage location is requested by someone not entitled to the owning entry
- **THEN** the system does not serve the file
