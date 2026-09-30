# competitor-intel Specification

## Purpose
Menyediakan pelacakan benchmark kompetitor per klien untuk mengukur kesenjangan performa (reach, engagement rate, dan frekuensi postingan) dibandingkan pesaing pasar langsung.

## Requirements

### Requirement: Client Competitor Benchmark Tracking
The system SHALL store and maintain benchmark figures (competitor name, social platform, follower count, average reach, engagement rate, and weekly post frequency) in `competitor_benchmarks`.

#### Scenario: Admin configures competitor benchmarks
- **WHEN** an admin adds or updates competitor data for a client in the competitors management view
- **THEN** benchmark records are saved and bound to the client's reporting context

### Requirement: Competitor Gap Analysis in AI Insights
The system SHALL inject comparative competitor metrics into automated AI executive insight prompts to identify strengths and competitive opportunities.

#### Scenario: Executive report generation
- **WHEN** generating weekly or monthly insight summaries
- **THEN** the AI narrative compares the client's ER and reach against tracked competitors with tactical recommendations
