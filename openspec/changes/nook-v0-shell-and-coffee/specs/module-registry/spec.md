## Purpose

Lets each hobby module describe itself once and have the app shell build navigation, routing, and capture options from that description, so that adding a module does not require changing the shell.

## ADDED Requirements

### Requirement: Modules are self-describing

Each module SHALL declare a manifest stating its identifier, display name, icon, the entry types and item types it can capture, and the components used to render its entries. The shell SHALL obtain all module-specific information from that manifest.

#### Scenario: Registering a module

- **WHEN** a module manifest is registered at application startup
- **THEN** the module becomes available for a user to enable
- **AND** its declared entry types become available to the capture flow when enabled

#### Scenario: Adding a module requires no shell changes

- **WHEN** a new module manifest is registered
- **THEN** the module appears in navigation, routing, and capture options once enabled
- **AND** no shell navigation, routing, or capture code is modified to accommodate it

### Requirement: Per-user module enablement

The system SHALL let each user choose which modules are active on their profile, and SHALL persist that choice to their account rather than to a device.

#### Scenario: Enabling a module

- **WHEN** a user enables a module from their profile
- **THEN** the module's navigation entry appears
- **AND** its entry types become available in the capture menu

#### Scenario: Enablement follows the account

- **WHEN** a user signs in on a second device
- **THEN** the same set of modules is enabled as on the first device

#### Scenario: No modules enabled

- **WHEN** a user has no modules enabled
- **THEN** the system presents a prompt to enable one
- **AND** navigation still provides access to the timeline and profile

### Requirement: Navigation reflects only enabled modules

The system SHALL derive the navigation entries and capture options from the set of modules the current user has enabled.

#### Scenario: Disabled module is hidden

- **WHEN** a user has not enabled a module
- **THEN** that module has no navigation entry
- **AND** its entry types are absent from the capture menu

### Requirement: Disabling a module preserves data and rendering

Disabling a module SHALL hide it from navigation and capture without deleting its data, and entries belonging to a disabled module SHALL continue to render wherever they appear.

#### Scenario: Disabling retains entries

- **WHEN** a user disables a module that has existing entries
- **THEN** those entries remain stored and are not deleted

#### Scenario: Entries from a disabled module still render

- **WHEN** a user views a timeline containing entries from a module they have disabled
- **THEN** those entries render with their module's normal card presentation
- **AND** selecting one opens its detail view in read-only form

#### Scenario: Re-enabling restores capture

- **WHEN** a user re-enables a previously disabled module
- **THEN** its navigation entry and capture options return
- **AND** its prior entries are editable again
