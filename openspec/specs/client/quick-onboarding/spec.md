# client/quick-onboarding Specification

## Purpose
Provides a streamlined client onboarding experience combining marketing foundation inputs (niche, target audience, core products, and USP) with automated AI generation of brand profile artifacts and initial skill pack assignments.

## Requirements

### Requirement: Smart Onboarding Form Fields
The system SHALL provide input fields for client name, contact email (optional), contact phone (optional), industry/niche (selected from predefined options including F&B, Fashion, Personal Brand, B2B/Corporate, E-Commerce, Retail, and Other), target audience summary, core product/services, and unique selling proposition (USP).

#### Scenario: Admin creates a client with marketing foundation inputs
- **WHEN** the admin submits the onboarding form with valid name, niche, target audience, products, and USP
- **THEN** the client record is created in the database and a background or synchronous pipeline initiates brand profile synthesis

#### Scenario: Validation failure on missing required fields
- **WHEN** the admin submits the form without a client name
- **THEN** the system rejects the submission and displays a clear validation error message

### Requirement: Automated Brand Profile Synthesis
The system SHALL use configured AI capabilities adhering to social media foundation skills (brand-profile, audience-research, voice-builder, content-pillars) to generate a structured `brand-profile.md` artifact containing Who We Are, Audience Persona, Voice & Guardrails, and Content Pillars.

#### Scenario: Successful generation of brand-profile.md
- **WHEN** a client is created with niche and USP details
- **THEN** the system generates a `brand-profile.md` markdown document and stores it in the client's file storage workspace

### Requirement: Automatic Skill Pack Seeding
The system SHALL automatically assign the "Social Media Starter Kit" pack and niche-relevant packs (such as Instagram & Reels Growth or TikTok Growth for F&B) to the newly created client.

#### Scenario: Client created in F&B niche
- **WHEN** a client is created with the "F&B" niche selected
- **THEN** the client's assigned skill packs in `client_skills` include the foundational starter kit and platform growth skills
