import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

// The browser Supabase client requires NEXT_PUBLIC_SUPABASE_URL/KEY at
// construction time and throws otherwise. Component tests run without those
// env vars, so stub the client module globally: components that read the
// current user (e.g. via useCurrentUser) get an anonymous, offline client
// instead of crashing on render.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
  }),
}))

// jsdom lacks these browser APIs that Radix UI (shadcn Dialog/Select) needs.
// Without them, rendering any Radix-based dialog throws "ResizeObserver is not
// defined" or a matchMedia error inside the test runner.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
}

if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof matchMedia
}

// jsdom has no Web Animations API. Base UI's ScrollArea viewport calls
// `viewport.getAnimations({ subtree: true })` in a setTimeout to recompute thumb
// geometry after transform animations; without this the call throws
// "viewport.getAnimations is not a function" as an unhandled exception. Returning
// an empty array makes the component's animation check bail out cleanly.
if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
  Element.prototype.getAnimations = function getAnimations() {
    return []
  } as unknown as typeof Element.prototype.getAnimations
}

// Radix UI's Select calls `candidate.scrollIntoView()` when opening the menu to
// keep the highlighted item in view. jsdom does not implement scrollIntoView, so
// the call throws "candidate?.scrollIntoView is not a function". A no-op stub
// keeps the component working under jsdom.
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}

/**
 * nuqs needs an adapter to work outside Next.js. Before each test we reset the
 * URL so useQueryState starts from a clean state, and stub next/navigation so
 * useRouter() does not blow up in jsdom.
 */
beforeEach(() => {
  window.history.replaceState({}, '', '/')
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
})
