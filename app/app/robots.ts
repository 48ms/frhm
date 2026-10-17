import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frhm.agency'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/waitlist'],
        disallow: [
          '/admin/',
          '/client/',
          '/api/',
          '/preview-calendar',
          '/preview-dashboard',
          '/preview-erp',
          '/preview-settings',
          '/preview-social-accounts',
          '/preview-support',
          '/auth/',
          '/review/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
