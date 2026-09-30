# creative-health Specification

## Purpose
Menganalisis keseimbangan format konten (reels, carousel, static, story), rasio tipe konten (promo, educational, entertainment, ugc), serta mendeteksi gejala kejenuhan audiens (creative fatigue).

## Requirements

### Requirement: Content Type and Format Tagging
The system SHALL categorize every scheduled post and metric row with a `content_type` ('promo', 'educational', 'entertainment', 'ugc') and a `creative_format` ('reels', 'carousel', 'static', 'story').

#### Scenario: Post creation and scheduling
- **WHEN** a post is planned or generated
- **THEN** it is tagged with its content type and creative format to enable multi-dimensional mix analysis

### Requirement: Creative Fatigue and Mix Imbalance Detection
The system SHALL analyze rolling engagement rates per format and alert operators when repeated formats experience sharp performance declines or when content mix skews heavily toward promotional material.

#### Scenario: Repetitive format underperforms
- **WHEN** three or more consecutive posts of the same format show an ER drop exceeding thirty percent
- **THEN** an alert is flagged in the report and prompt recommending immediate format rotation
