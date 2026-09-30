import '@testing-library/jest-dom/vitest'

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
