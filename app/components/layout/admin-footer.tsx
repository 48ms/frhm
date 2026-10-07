/**
 * Shared admin footer, rendered once in the admin layout so every admin page
 * inherits it (reference: _stitch-admin/code.html lines 845-857).
 *
 * Styling is scoped to the admin theme tokens; it must never leak into the
 * client portal, which is why it lives in the admin layout rather than a
 * generic shell component.
 */
export function AdminFooter() {
  return (
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-[hsl(var(--admin-outline-variant))]/30 pt-8 pb-12 text-xs text-[hsl(var(--admin-outline))] sm:flex-row">
      <div className="flex items-center gap-2">
        <span className="font-syne text-base font-bold text-[hsl(var(--admin-on-surface))]">
          FRHM
        </span>
        <span>© 2026 Frhm. All rights reserved.</span>
      </div>
      <div className="flex items-center gap-6 font-medium text-muted-foreground">
        <span>Privacy Policy</span>
        <span>Terms of Service</span>
        <span>API Documentation</span>
        <span>System Status</span>
      </div>
    </footer>
  )
}
