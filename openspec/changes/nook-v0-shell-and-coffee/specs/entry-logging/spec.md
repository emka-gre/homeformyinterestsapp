## Purpose

Defines the shared record of "something I did" and "something I own" that every hobby module logs into, so that notes, ratings, and history work identically across modules and can be queried together.

## ADDED Requirements

### Requirement: Creating an entry

The system SHALL allow a user to record an entry belonging to one of the entry types declared by an enabled module. Every entry SHALL have an owner, an entry type, and a time at which the recorded activity occurred.

#### Scenario: Recording an activity

- **WHEN** a user completes a module's capture flow and saves
- **THEN** the system stores an entry owned by that user, with its entry type and occurrence time
- **AND** the entry appears in the user's timeline

#### Scenario: Occurrence time defaults to now

- **WHEN** a user creates an entry without specifying when it happened
- **THEN** the system records the current time as the occurrence time

#### Scenario: Backdating an entry

- **WHEN** a user sets the occurrence time to a moment in the past
- **THEN** the system stores that time
- **AND** the entry appears in timeline position according to its occurrence time, not its creation time

### Requirement: Module-specific payload

An entry SHALL carry a payload conforming to the schema its module declares for that entry type. The system SHALL reject an entry whose payload does not conform.

#### Scenario: Valid payload

- **WHEN** a user saves an entry whose payload satisfies its entry type's schema
- **THEN** the system stores the entry with that payload intact

#### Scenario: Invalid payload

- **WHEN** an entry is submitted with a payload that violates its entry type's schema
- **THEN** the system rejects the save
- **AND** reports which fields are invalid without discarding the user's other input

### Requirement: Shared notes, rating, and tags

The system SHALL provide free-text notes, an optional rating, and optional tags on every entry regardless of module, and SHALL make these queryable across modules.

#### Scenario: Rating any entry

- **WHEN** a user sets a rating on an entry of any module
- **THEN** the system stores it as a core attribute of the entry

#### Scenario: Cross-module query by rating

- **WHEN** a user filters their entries by a rating value
- **THEN** results include matching entries from every module, not only one

#### Scenario: Notes are optional

- **WHEN** a user saves an entry without notes, rating, or tags
- **THEN** the system stores the entry successfully

### Requirement: Entry status

Every entry SHALL have a status of `planned`, `in_progress`, or `done`, defaulting to `done`, so that any module can represent an intention, an activity underway, and a completed record.

#### Scenario: Default status

- **WHEN** an entry is created without an explicit status
- **THEN** the system stores it with status `done`

#### Scenario: Storing a non-default status

- **WHEN** an entry is created or updated with status `planned` or `in_progress`
- **THEN** the system stores that status
- **AND** the entry is not treated as a record of something that happened

#### Scenario: Marking an entry complete

- **WHEN** a user changes an entry's status from `planned` or `in_progress` to `done`
- **THEN** the system persists the change
- **AND** the entry is thereafter treated as a record of something that happened

#### Scenario: Rejecting an unrecognized status

- **WHEN** an entry is submitted with a status outside the permitted values
- **THEN** the system rejects the save

### Requirement: Editing an entry

The system SHALL allow the owner of an entry to modify any of its fields after creation.

#### Scenario: Editing after saving

- **WHEN** an owner edits an entry and saves
- **THEN** the system persists the updated values
- **AND** records that the entry was modified

### Requirement: Deleting an entry

The system SHALL allow the owner of an entry to delete it, and SHALL require confirmation before doing so.

#### Scenario: Deleting an entry

- **WHEN** an owner confirms deletion of an entry
- **THEN** the system removes the entry from the user's timeline and views
- **AND** removes media attached solely to that entry

#### Scenario: Deletion requires confirmation

- **WHEN** an owner initiates deletion
- **THEN** the system requests confirmation before removing anything

### Requirement: Items

The system SHALL support items — reusable things a user owns or references, such as a bag of beans or a recipe — declared by module item types, owned by a user, and optionally referenced by entries.

#### Scenario: Creating an item

- **WHEN** a user creates an item of a type declared by an enabled module
- **THEN** the system stores it owned by that user
- **AND** it becomes available to reference from that module's entries

#### Scenario: Referencing an item from an entry

- **WHEN** a user selects an item while creating an entry
- **THEN** the system records the reference
- **AND** the entry's detail view shows the referenced item

#### Scenario: Item reference is optional

- **WHEN** a user saves an entry without selecting an item
- **THEN** the system stores the entry with no item reference

#### Scenario: Deleting a referenced item

- **WHEN** a user deletes an item that entries reference
- **THEN** the system warns that those entries reference it
- **AND** on confirmation the affected entries remain, with the reference cleared
