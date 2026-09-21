import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Clickjacking protection — the app can never be framed by a third party.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stop MIME-type sniffing — a .txt should never be executed as script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy XSS filter — harmless where unsupported, defence-in-depth where honoured.
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Force HTTPS for a year, including subdomains.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Limit referrer leakage to other origins.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable powerful browser features the app does not use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy — permissive enough for Supabase + AI providers, but blocks
  // inline framing and object embedding. 'unsafe-inline' is required for Next.js runtime styles.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://openrouter.ai https://o4512121963347968.ingest.us.sentry.io",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Supabase Storage serves brand assets from <project>.supabase.co
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/**' },
      { protocol: 'https', hostname: '*.supabase.in', pathname: '/storage/v1/object/**' },
    ],
  },
  // React Compiler — memoize derived values automatically where types allow.
  // `infer` mode only compiles what the type checker can prove is safe, so the
  // opt-in is conservative and won't break existing component behaviour.
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  // Webpack config: disable eval source maps (Edge Runtime bug on Windows)
  // Next.js 16 uses Turbopack by default; --webpack needed for production build
  webpack: (config, { dev }) => {
    config.devtool = false;
    config.plugins = config.plugins.filter(
      (p) => !p.constructor || !p.constructor.name.includes('EvalSourceMap')
    );
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/sentry-tunnel",
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
