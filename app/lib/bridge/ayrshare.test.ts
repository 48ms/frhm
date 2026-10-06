import { describe, it, expect } from 'vitest'
import { toBridgePlatform, BRIDGE_PLATFORMS } from './ayrshare'

describe('toBridgePlatform', () => {
  it('maps canonical lowercase names to bridge platforms', () => {
    expect(toBridgePlatform('instagram')).toBe('instagram')
    expect(toBridgePlatform('TikTok')).toBe('tiktok')
    expect(toBridgePlatform('LinkedIn')).toBe('linkedin')
    expect(toBridgePlatform('YouTube')).toBe('youtube')
    expect(toBridgePlatform('Facebook')).toBe('facebook')
  })

  it('maps the Frahma "x" alias to the Ayrshare "twitter" platform', () => {
    // `features/calendar/types.ts` exposes X as key "x", but Ayrshare expects
    // "twitter". Posts created with platform "x" must still resolve, otherwise
    // they fail permanently in the publish cron ("Platform x not supported").
    expect(toBridgePlatform('x')).toBe('twitter')
    expect(toBridgePlatform('X')).toBe('twitter')
  })

  it('passes the bridge platform name through unchanged when already normalized', () => {
    expect(toBridgePlatform('twitter')).toBe('twitter')
  })

  it('returns null for unsupported platforms', () => {
    expect(toBridgePlatform('myspace')).toBeNull()
    expect(toBridgePlatform('')).toBeNull()
  })

  it('keeps "pinterest" in the supported set (Ayrshare supports it)', () => {
    expect(BRIDGE_PLATFORMS).toContain('pinterest')
    expect(toBridgePlatform('pinterest')).toBe('pinterest')
  })
})
