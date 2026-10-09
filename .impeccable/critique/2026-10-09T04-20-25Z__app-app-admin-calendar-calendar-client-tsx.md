---
target: app/app/admin/calendar/calendar-client.tsx
total_score: 33
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\bimam\\Downloads\\Tools Frahma\\app\\app\\admin\\calendar\\calendar-client.tsx"
target_fingerprint: "sha256:821bcd9889d8b82358ed7ea5a971e69a1966d38948f3bebf9d02d61261451f13"
target_path: "C:\\Users\\bimam\\Downloads\\Tools Frahma\\app\\app\\admin\\calendar\\calendar-client.tsx"
timestamp: 2026-10-09T04-20-25Z
slug: app-app-admin-calendar-calendar-client-tsx
---
# Critique: Admin Calendar (PostDialog hardening)

Method: degraded: single-context (static code analysis + structural review)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Caption counter now shows used/limit live |
| 2 | Match System / Real World | 4 | Agency workflow terms are natural |
| 3 | User Control and Freedom | 4 | Safe exits in split-pane composer |
| 4 | Consistency and Standards | 4 | nuqs URL state, shadcn Nova |
| 5 | Error Prevention | 3 | Over-limit + empty posts now blocked at submit |
| 6 | Recognition Rather Than Recall | 4 | Status grouping is intuitive |
| 7 | Flexibility and Efficiency | 3 | Still no bulk/inline edit on the calendar |
| 8 | Aesthetic and Minimalist Design | 4 | Clean hierarchy |
| 9 | Error Recovery | 3 | Field-level error added; no visible retry |
| 10 | Help and Documentation | n/a | Internal B2B tool |
| Total | | 33/36 | Good (92%) |

## Design Specificity Verdict

LLM assessment: authored for Frhm. useActiveDashboard + nuqs URL state give
deep-linkable navigation rare in generic dashboards.

Deterministic scan: clean (impeccable detect returned []).

## What's Working

1. Split-pane composer keeps preview and form in one context.
2. URL-synced calendar state enables deep links to a given view/platform.

## Priority Issues

1. [P1] Empty / over-limit posts were schedulable but fail at cron publish.
   Fix: per-platform CAPTION_LIMIT + empty-content guard + inline errors.
   Command: /impeccable harden  -- DONE
2. [P2] No batch scheduling UX; admin edits one post at a time.
   Fix: drag-and-drop from Library into calendar. Command: /impeccable optimize
3. [P3] No visible progress feedback for batch operations.
   Fix: progress bar. Command: /impeccable polish

## Persona Red Flags

Alex (Power User): must open each post to edit; wants inline editing.
Jordan (First-Timer): Brainstorm feature needs a prompt hint.

## Minor Observations

- Lucide iconography consistent.
- Status pill contrast meets AA.

## Questions to Consider

- What if the calendar supported inline caption editing?
- Does the Brainstorm modal need example prompts?
