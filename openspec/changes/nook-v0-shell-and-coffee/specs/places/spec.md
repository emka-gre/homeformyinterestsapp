## Purpose

Records the physical places a user's activities happen — cafés, galleries, gyms — as reusable pins shared across modules, so that "where" is answered once rather than per module.

## ADDED Requirements

### Requirement: Attaching a place to an entry

The system SHALL allow a user to associate a place with an entry, for modules whose manifest declares that they use places.

#### Scenario: Selecting a place during capture

- **WHEN** a user selects a place while creating an entry in a place-using module
- **THEN** the system records the association
- **AND** the entry's detail view shows the place

#### Scenario: Place is optional

- **WHEN** a user saves an entry without selecting a place
- **THEN** the system stores the entry with no place reference

#### Scenario: Module does not use places

- **WHEN** a user captures an entry in a module whose manifest does not declare place usage
- **THEN** the capture flow does not offer a place field

### Requirement: Finding and creating places

The system SHALL let a user find an existing place by name and, when none matches, create a new one with a name and a location.

#### Scenario: Searching by name

- **WHEN** a user types part of a place name
- **THEN** the system offers matching places the user has previously recorded

#### Scenario: Creating a new place

- **WHEN** no existing place matches and the user supplies a name and location
- **THEN** the system creates the place
- **AND** makes it available for future entries

#### Scenario: Using the current location

- **WHEN** a user creating a place chooses to use their current location
- **AND** location permission has been granted
- **THEN** the system pre-fills the coordinates from the device

#### Scenario: Location permission denied

- **WHEN** location permission is unavailable
- **THEN** the system allows the place to be located by searching or by choosing a point on a map

### Requirement: Places are reusable across entries and modules

A place SHALL be a persistent record owned by the user that any number of entries, from any place-using module, can reference.

#### Scenario: Revisiting a place

- **WHEN** a user selects a place they have used before
- **THEN** the system references the existing place rather than creating a duplicate

#### Scenario: Place used by more than one module

- **WHEN** entries from different place-using modules reference the same place
- **THEN** the system associates all of them with that single place record

#### Scenario: Renaming a place

- **WHEN** an owner renames a place
- **THEN** every entry referencing it reflects the new name

### Requirement: Map view of places

The system SHALL present the user's places on a map, on both mobile and web.

#### Scenario: Viewing places on a map

- **WHEN** a user opens the map view
- **THEN** the system displays a pin for each of their places

#### Scenario: Opening a pin

- **WHEN** a user selects a pin
- **THEN** the system shows the place's name and the entries recorded there

#### Scenario: No places yet

- **WHEN** a user with no recorded places opens the map view
- **THEN** the system explains how places are added rather than showing an empty map without context
