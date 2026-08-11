## Purpose

The Coffee module: logging beans, brews, tasting notes, and cafés visited. It is the first module, and its job is both to be genuinely useful daily and to exercise the shared core — media, notes, ratings, items, and places — end to end.

## ADDED Requirements

### Requirement: Coffee module registration

The Coffee module SHALL register a manifest declaring a bean item type, a brew entry type, and its use of places, so that the shell can present it without module-specific handling.

#### Scenario: Enabling Coffee

- **WHEN** a user enables the Coffee module
- **THEN** a Coffee navigation entry appears
- **AND** logging a brew becomes available from the capture menu

### Requirement: Bean items

The system SHALL allow a user to record a coffee bean as an item, capturing at minimum a name, and optionally roaster, origin, roast date, process, and a photograph.

#### Scenario: Adding beans

- **WHEN** a user saves a new bean with a name
- **THEN** the system stores it as an item owned by that user
- **AND** it becomes selectable when logging a brew

#### Scenario: Photographing beans

- **WHEN** a user attaches a photo while creating a bean
- **THEN** the photo is stored with the bean
- **AND** appears wherever the bean is displayed

#### Scenario: Optional details

- **WHEN** a user saves a bean with only a name
- **THEN** the system stores it without requiring roaster, origin, roast date, or process

### Requirement: Brew entries

The system SHALL allow a user to log a brew as an entry, recording the brewing method and method-appropriate parameters, and optionally referencing a bean.

#### Scenario: Logging a brew

- **WHEN** a user selects a brewing method, fills in its parameters, and saves
- **THEN** the system stores a brew entry with its occurrence time
- **AND** it appears in the user's timeline

#### Scenario: Method-appropriate parameters

- **WHEN** a user selects a brewing method
- **THEN** the capture form presents the parameters relevant to that method

#### Scenario: Referencing a bean

- **WHEN** a user selects one of their beans while logging a brew
- **THEN** the brew records that reference
- **AND** the brew's detail view shows which bean was used

#### Scenario: Brew without a bean

- **WHEN** a user logs a brew without selecting a bean
- **THEN** the system stores the brew successfully

#### Scenario: Invalid parameters

- **WHEN** a user enters a brew parameter outside its permitted range
- **THEN** the system prevents saving
- **AND** indicates which parameter is invalid

### Requirement: Tasting notes and rating

The system SHALL allow a user to record free-text tasting notes and a rating on a brew, using the shared entry notes and rating rather than a Coffee-specific mechanism.

#### Scenario: Recording a tasting note

- **WHEN** a user writes tasting notes and sets a rating on a brew and saves
- **THEN** the system stores them as core attributes of the entry
- **AND** they are included when entries are filtered by rating across modules

### Requirement: Cafés as places

The system SHALL allow a user to record a brew as having happened at a café, using the shared place records.

#### Scenario: Logging a brew at a café

- **WHEN** a user selects or creates a café while logging a brew
- **THEN** the system associates the place with the entry
- **AND** the café appears on the map view

#### Scenario: Brew at home

- **WHEN** a user logs a brew without selecting a place
- **THEN** the system stores the brew with no place reference

### Requirement: Coffee library

The system SHALL provide a view of the user's coffee history, listing their brews and their beans.

#### Scenario: Browsing brews

- **WHEN** a user opens the Coffee section
- **THEN** the system lists their brews, most recent first

#### Scenario: Browsing beans

- **WHEN** a user views their beans
- **THEN** the system lists them
- **AND** selecting one shows its details and the brews made with it

#### Scenario: No coffee logged yet

- **WHEN** a user who has enabled Coffee but logged nothing opens the Coffee section
- **THEN** the system invites them to log their first brew
