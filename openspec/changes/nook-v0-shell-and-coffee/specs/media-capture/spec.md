## Purpose

Lets a user attach photographs to what they log — a bag of beans, a plate, a gallery wall — using one capture and upload path shared by every module rather than one per module.

## ADDED Requirements

### Requirement: Attaching photos

The system SHALL allow a user to attach one or more photos to an entry or an item, using the same capture flow regardless of which module the entry belongs to.

#### Scenario: Taking a photo on a mobile device

- **WHEN** a user chooses to add a photo during capture on a mobile device
- **THEN** the system offers both the device camera and the photo library
- **AND** the selected image is attached to the record being created

#### Scenario: Adding a photo on web

- **WHEN** a user chooses to add a photo in the web app
- **THEN** the system opens a file picker
- **AND** the selected image is attached to the record being created

#### Scenario: Multiple photos

- **WHEN** a user attaches more than one photo to a single record
- **THEN** the system stores all of them
- **AND** preserves the order in which they were added

#### Scenario: Permission denied

- **WHEN** a user declines camera or photo library permission
- **THEN** the system explains that photos cannot be added without it
- **AND** allows the user to complete the entry without a photo

### Requirement: Upload is not required to complete an entry

The system SHALL allow a user to save an entry while its photos are still uploading, and SHALL complete those uploads without further user action.

#### Scenario: Saving while upload is in progress

- **WHEN** a user saves an entry whose photo has not finished uploading
- **THEN** the system stores the entry immediately
- **AND** indicates that the photo is still uploading

#### Scenario: Upload failure

- **WHEN** a photo upload fails
- **THEN** the system retains the entry
- **AND** indicates the photo failed to upload
- **AND** offers to retry

### Requirement: Removing photos

The system SHALL allow the owner to remove a photo from an entry or item.

#### Scenario: Removing an attached photo

- **WHEN** an owner removes a photo from a record
- **THEN** the system detaches it from that record
- **AND** the photo no longer appears in the record's views

### Requirement: Photos display without full download

The system SHALL present photos in lists and cards at a size appropriate to that context rather than requiring the full-resolution image to be downloaded.

#### Scenario: Photo in a timeline card

- **WHEN** a timeline renders an entry that has a photo
- **THEN** the card displays a reduced-size version of the image

#### Scenario: Viewing at full size

- **WHEN** a user opens a photo from an entry's detail view
- **THEN** the system presents the full-resolution image
