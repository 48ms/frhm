import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './app-store'

describe('app-store mediaUrl persistence', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('addPost stores mediaUrl from a library asset', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/taraju/reel.mp4'
    useAppStore.getState().addPost({
      clientId: 'client-shell',
      title: 'Reel Taraju',
      caption: 'Caption',
      platform: 'instagram',
      scheduledAt: new Date().toISOString(),
      status: 'draft',
      author: 'Current User',
      mediaUrl: url,
    })

    const posts = useAppStore.getState().posts
    const created = posts.find((p) => p.title === 'Reel Taraju')
    expect(created).toBeDefined()
    expect(created?.mediaUrl).toBe(url)
  })

  it('addPost leaves mediaUrl undefined for text-only posts', () => {
    useAppStore.getState().addPost({
      clientId: 'client-shell',
      title: 'Text only',
      caption: 'No media',
      platform: 'instagram',
      scheduledAt: new Date().toISOString(),
      status: 'draft',
      author: 'Current User',
    })

    const created = useAppStore.getState().posts.find((p) => p.title === 'Text only')
    expect(created?.mediaUrl).toBeUndefined()
  })
})
