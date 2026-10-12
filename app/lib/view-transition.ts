import { flushSync } from "react-dom"

/**
 * View Transitions helper (Operate-mode motion).
 *
 * Runs a React state update inside the browser's same-document
 * `startViewTransition` so a named element (a card, a button) can morph into
 * the surface it opens — the modal dialog — via a shared
 * `view-transition-name` on both the trigger and the target.
 *
 * Progressive enhancement: browsers without the API (Firefox same-document
 * works; older engines and cross-document do not) simply run the update. The
 * existing `animate-in` fallback on the dialogs keeps the open/close feel
 * intact, so nothing regresses.
 *
 * Caller contract:
 * - TRIGGER: `style={{ viewTransitionName: open ? undefined : name }}` so the
 *   old snapshot captures it and the new one does not — a duplicate name at
 *   capture time aborts the whole transition.
 * - TARGET (the dialog): `style={{ viewTransitionName: name }}`.
 * - Wrap the state change: `withViewTransition(() => setOpen(true))`.
 */
export function withViewTransition(update: () => void): void {
  if (typeof document === "undefined") {
    update()
    return
  }

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown
  }

  if (typeof doc.startViewTransition !== "function") {
    update()
    return
  }

  try {
    // `flushSync` is required: the transition snapshots the DOM immediately
    // after the callback resolves, so React must have committed the new tree.
    doc.startViewTransition(() => flushSync(update))
  } catch {
    // A transition already in flight, or a runtime without full support:
    // fall back to the plain update rather than dropping the interaction.
    update()
  }
}

/** Unique, stable transition name for a campaign surface. */
export function campaignTransitionName(id: string | null | undefined): string {
  return id ? `campaign-${id}` : "campaign-new"
}
