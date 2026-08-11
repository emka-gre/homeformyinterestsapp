## Purpose

Shows everything a user has logged in one reverse-chronological view across every module, making the consolidation of separate hobby apps into one visible and useful from the first day.

## ADDED Requirements

### Requirement: Unified reverse-chronological view

The system SHALL present the user's own entries from all modules in a single list ordered by occurrence time, most recent first.

#### Scenario: Entries from multiple modules interleave

- **WHEN** a user with entries from more than one module opens the timeline
- **THEN** entries from all of those modules appear in one list
- **AND** ordering follows occurrence time across modules, not module grouping

#### Scenario: Backdated entry is positioned by occurrence

- **WHEN** a user records an entry with a past occurrence time
- **THEN** the timeline places it according to that time rather than at the top

### Requirement: Timeline shows only the viewer's own entries

In the absence of a social feed, the timeline SHALL contain only entries owned by the signed-in user, regardless of any entry's visibility setting.

#### Scenario: Only own entries appear

- **WHEN** a user opens the timeline
- **THEN** every entry shown is owned by that user

### Requirement: Timeline shows only completed entries

The timeline is a record of what the user has done, so it SHALL contain only entries with status `done`. Entries that are `planned` or `in_progress` SHALL be excluded.

#### Scenario: Planned entry is excluded

- **WHEN** a user's entries include one with status `planned`
- **THEN** the timeline does not show it, whatever its occurrence time

#### Scenario: In-progress entry is excluded

- **WHEN** a user's entries include one with status `in_progress`
- **THEN** the timeline does not show it

#### Scenario: Completing an entry adds it to the timeline

- **WHEN** an entry's status changes to `done`
- **THEN** the timeline shows it in the position given by its occurrence time

### Requirement: Entries render using their module's presentation

Each entry SHALL be rendered by the card presentation declared in its module's manifest, so that a coffee log and a workout are each legible in their own terms.

#### Scenario: Module-specific card

- **WHEN** the timeline renders an entry
- **THEN** it uses the card declared by that entry's module

#### Scenario: Entry from a disabled module

- **WHEN** the timeline contains an entry belonging to a module the user has disabled
- **THEN** the entry still renders with its module's card

#### Scenario: Opening an entry

- **WHEN** a user selects an entry in the timeline
- **THEN** the system opens that entry's detail view

### Requirement: Loading additional history

The system SHALL load older entries incrementally rather than requiring the full history to be retrieved at once.

#### Scenario: Scrolling back through history

- **WHEN** a user scrolls to the end of the loaded entries
- **THEN** the system loads the next older set
- **AND** existing scroll position is preserved

### Requirement: Empty state

The system SHALL present a useful empty state when the user has no entries.

#### Scenario: New user with no entries

- **WHEN** a user with no entries opens the timeline
- **THEN** the system invites them to log something
- **AND** offers the capture options for their enabled modules

#### Scenario: No modules enabled

- **WHEN** a user with no enabled modules opens the timeline
- **THEN** the system directs them to enable a module on their profile
