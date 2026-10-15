import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { buildDeliverablePdfBlob, DeliverablePdfDocument } from './deliverable-pdf'

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => React.createElement('div', { 'data-testid': 'pdf-doc' }, children),
  Page: ({ children }: any) => React.createElement('div', { 'data-testid': 'pdf-page' }, children),
  Text: ({ children }: any) => React.createElement('span', null, children),
  View: ({ children }: any) => React.createElement('div', null, children),
  StyleSheet: {
    create: (styles: any) => styles,
  },
  pdf: vi.fn().mockImplementation(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(['mock-pdf-content'], { type: 'application/pdf' })),
  })),
}))

describe('lib/pdf/deliverable-pdf', () => {
  it('generates a valid PDF blob using buildDeliverablePdfBlob', async () => {
    const blob = await buildDeliverablePdfBlob({
      title: 'Monthly Editorial Strategy Plan',
      clientName: 'Pawon Sengon',
      deliverableType: 'strategy',
      status: 'approved',
      contentMarkdown: '# Strategi Q4\n- Postingan Reels harian\n- Cerita di balik layar',
      includeSignatureBlock: true,
      themeColor: 'emerald',
    })

    expect(blob).toBeDefined()
    expect(blob.type).toBe('application/pdf')
  })

  it('renders DeliverablePdfDocument with title, client name, and signature block', () => {
    const element = DeliverablePdfDocument({
      options: {
        title: 'Video Script & Scene Breakdown',
        clientName: 'Taraju',
        deliverableType: 'content',
        status: 'approved',
        contentMarkdown: '## Scene 1\nHalo semuanya\n- Action: Tunjuk produk',
        includeSignatureBlock: true,
        watermarkText: 'CONFIDENTIAL',
        themeColor: 'cobalt',
      },
    })

    expect(element).toBeDefined()
    expect(element.props.title).toBe('Video Script & Scene Breakdown — Taraju')
  })
})
