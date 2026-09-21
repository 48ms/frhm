import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Sentry v10: capture errors that happen in Server Components, route handlers,
// and middleware (Next.js 15+/16 onRequestError hook).
export const onRequestError = Sentry.captureRequestError;
