# design-system-standards Specification

## Purpose
Menetapkan standar baku visual dan komponen UI platform Frhm yang mengadopsi icon registry terpusat, layout PageContainer wajib, tombol loading zero layout-shift, dan 10 tema OKLCH dengan animasi wave.

## Requirements

### Requirement: Centralized Icon Registry
The system SHALL centralize all icon declarations in `@/components/icons.tsx` and SHALL disallow direct imports from icon libraries in feature components.

#### Scenario: Developer or component requests an icon
- **WHEN** an icon is needed in a feature component or page
- **THEN** it is imported exclusively via `import { Icons } from '@/components/icons'` and rendered using semantic keys (e.g. `Icons.search`, `Icons.check`)

### Requirement: Mandatory PageContainer Layout
The system SHALL enforce that all primary administrative and client pages are rendered within `<PageContainer>` using standard header props (`pageTitle`, `pageDescription`, `pageHeaderAction`, `infoContent`).

#### Scenario: User navigates to any admin or client work page
- **WHEN** the page mounts
- **THEN** the page displays a consistent heading, description, contextual actions, and optional info sidebar trigger provided by the PageContainer shell

### Requirement: Zero Layout-Shift Button Loading State
The system SHALL provide a `Button` component supporting an `isLoading` property that overlays the spinner and content using CSS grid layering so the button width and height do not shift during transitions.

#### Scenario: User triggers a mutation or asynchronous action
- **WHEN** the action is in progress and `isLoading` is set to true
- **THEN** a spinner appears centered while the original label remains in the layout flow, preventing any layout shift or button resizing

### Requirement: Multi-Theme OKLCH System with View Transition
The system SHALL support multiple predefined OKLCH themes (Vercel, Supabase, Claude, Discord, etc.) and apply theme transitions using CSS `::view-transition-new(root)` wave animations.

#### Scenario: User switches active visual theme
- **WHEN** the user selects a different theme from the theme selector
- **THEN** the active data-theme attribute on `<html>` updates smoothly with a circular reveal wave animation without hard refresh
