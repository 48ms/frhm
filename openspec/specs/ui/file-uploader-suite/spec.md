# file-uploader-suite Specification

## Purpose
Menyediakan komponen pengunggah berkas drag-and-drop multi-file dengan pelacakan persentase progres per berkas, validasi MIME/ukuran, dan pratinjau visual.

## Requirements

### Requirement: Drag-and-Drop Multi-File Uploader
The system SHALL provide a `FileUploader` component supporting drag-and-drop file ingestion, file type constraints, and maximum size limits.

#### Scenario: User drops multiple creative media assets
- **WHEN** user drags and drops one or more image or video files onto the upload zone
- **THEN** valid files are queued for upload and invalid files trigger contextual error notifications

### Requirement: Individual Progress Tracking per File
The system SHALL display an individual progress bar for each file actively uploading.

#### Scenario: Files are uploading in parallel
- **WHEN** an upload batch is in progress
- **THEN** each file card displays its own progress percentage from 0 to 100%

### Requirement: Asset Preview and Removal
The system SHALL render preview thumbnails for images and file icons for documents with a one-click removal button.

#### Scenario: User removes an asset before final submission
- **WHEN** the user clicks the remove icon on a preview card
- **THEN** the file is pruned from the upload queue and memory is freed
