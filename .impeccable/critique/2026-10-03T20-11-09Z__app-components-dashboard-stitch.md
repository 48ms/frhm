---
target: app/components/dashboard-stitch
total_score: 26
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\bimam\\Downloads\\Tools Frahma\\app\\components\\dashboard-stitch"
timestamp: 2026-10-03T20-11-09Z
slug: app-components-dashboard-stitch
closed: true
---
⚠️ DEGRADED: single-context (no sub-agent tool exposed)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good use of badges ("SYNCED"), but some loading states aren't visible |
| 2 | Match System / Real World | 4 | Uses standard dashboard language perfectly |
| 3 | User Control and Freedom | 3 | Easy to switch clients and disconnect channels |
| 4 | Consistency and Standards | 4 | Consistent glassmorphism UI language |
| 5 | Error Prevention | 2 | No confirmation modal before disconnecting a channel |
| 6 | Recognition Rather Than Recall | 3 | Connected accounts listed visually with icons |
| 7 | Flexibility and Efficiency | 2 | Missing keyboard shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but slightly busy with decorative blurs |
| 9 | Error Recovery | n/a | No error states defined in this subset |
| 10 | Help and Documentation | 2 | Minimal contextual help available |
| **Total** | | **26/36** | **Good** |

#### Design Specificity Verdict

**LLM assessment**: The dashboard design is highly specific and polished, utilizing a distinct glassmorphic style with neon accents (cobalt and brand accent). It feels authored for a modern, high-velocity social media management product.
**Deterministic scan**: No structural issues found via automated scan (0 findings).
**Visual overlays**: Skipped due to lack of browser visualization tools in degraded mode.

#### Overall Impression
A visually striking, modern dashboard that nails the "high velocity" aesthetic. The glassmorphism and bold typography work well. The biggest opportunity is hardening the interactions (like destructive actions) and ensuring keyboard accessibility matches the visual polish.

#### What's Working
- **Visual Hierarchy**: The KPI grid and performance chart are beautifully separated from the right panel, making the layout easy to digest.
- **Client Switching**: The inline client switcher in the hero and right panel is a smooth, context-aware pattern.
- **Data Visualization**: The performance chart with animated SVG paths is highly engaging.

#### Priority Issues
- **[P1] Missing confirmation on destructive action**
  - **Why it matters**: Disconnecting a channel in `right-panel.tsx` happens immediately on click. Accidental clicks will cause frustration and potential data sync issues.
  - **Fix**: Add a confirmation dialog before calling `disconnectAccount(ch.id)`.
  - **Suggested command**: `/impeccable harden`

- **[P2] Custom Client Switcher Keyboard Accessibility**
  - **Why it matters**: The client picker in `right-panel.tsx` and `hero.tsx` uses custom `div`s and `button`s for a dropdown but lacks full ARIA keyboard support (e.g., arrow key navigation, escape to close).
  - **Fix**: Implement proper focus management or switch to a radix-ui/shadcn Select component.
  - **Suggested command**: `/impeccable audit`

- **[P3] Visual Noise in Hero**
  - **Why it matters**: The decorative blurred shapes (`bg-[hsl(var(--admin-cobalt))]/15`) are stylish but slightly compete with the primary actions (Export/Schedule).
  - **Fix**: Reduce the opacity of the decorative blurs by 5-10%.
  - **Suggested command**: `/impeccable quieter`

#### Persona Red Flags

**Alex (Power User)**:
- No keyboard shortcuts for Export Report or Schedule Post.
- Forced to use the mouse to switch clients.

**Sam (Accessibility-Dependent)**:
- Custom dropdowns for client switching may trap screen readers or fail to announce state changes.
- Disconnect button in right panel appears only on hover (`opacity-0 group-hover:opacity-100`), which is inaccessible to keyboard-only navigation unless focused.

#### Minor Observations
- The `hoverX` logic in the performance chart is clever but might feel slightly jittery if the mouse moves very fast.
- The "Need AI Content Hooks?" card is a great contextual upsell.

#### Questions to Consider
- Does the "Studio Identity" card need to take up so much vertical space in the right panel, or could those metrics be integrated into the main KPI grid?
- Should disconnecting a channel be a primary action on this dashboard, or moved to a dedicated settings page?
