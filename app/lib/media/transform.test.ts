import { describe, it, expect } from 'vitest'
import { withTransform, thumbnailUrl, previewUrl } from './transform'

const CLOUD_IMG =
  'https://res.cloudinary.com/demo/image/upload/v1234/frhm/client-a/photo.jpg'
const CLOUD_VIDEO =
  'https://res.cloudinary.com/demo/video/upload/v1234/frhm/client-a/reel.mp4'

describe('media transform', () => {
  it('injects a thumb transform into a Cloudinary image URL', () => {
    const out = thumbnailUrl(CLOUD_IMG)
    expect(out).toContain('/image/upload/c_fill,w_200,h_200,q_auto,f_auto/')
    expect(out).toContain('photo.jpg')
  })

  it('injects a transform into a Cloudinary video URL', () => {
    const out = withTransform(CLOUD_VIDEO, 'card')
    expect(out).toContain('/video/upload/c_fill,w_600,h_600,q_auto,f_auto/')
  })

  it('returns non-Cloudinary URLs untouched', () => {
    const external = 'https://example.com/assets/pic.png'
    expect(withTransform(external, 'thumb')).toBe(external)
    expect(thumbnailUrl(external)).toBe(external)
  })

  it('returns an empty string for empty input', () => {
    expect(withTransform('', 'thumb')).toBe('')
  })

  it('does not stack a second transform when one already exists', () => {
    const already = 'https://res.cloudinary.com/demo/image/upload/w_100/photo.jpg'
    expect(withTransform(already, 'thumb')).toBe(already)
  })

  it('previewUrl keeps quality auto without a fixed crop', () => {
    const out = previewUrl(CLOUD_IMG)
    expect(out).toContain('/image/upload/q_auto,f_auto/')
  })
})
