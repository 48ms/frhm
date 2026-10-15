import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'

export interface DeliverablePdfOptions {
  title: string
  clientName: string
  deliverableType: string
  status: string
  contentMarkdown: string
  createdAt?: string
  approvedAt?: string | null
  authorName?: string
  themeColor?: 'cobalt' | 'emerald' | 'indigo' | 'monochrome'
  includeSignatureBlock?: boolean
  watermarkText?: string
}

const THEME_COLORS = {
  cobalt: { primary: '#1d4ed8', secondary: '#2563eb', bgSoft: '#eff6ff', border: '#bfdbfe' },
  emerald: { primary: '#047857', secondary: '#059669', bgSoft: '#ecfdf5', border: '#a7f3d0' },
  indigo: { primary: '#4338ca', secondary: '#4f46e5', bgSoft: '#eef2ff', border: '#c7d2fe' },
  monochrome: { primary: '#18181b', secondary: '#27272a', bgSoft: '#f4f4f5', border: '#e4e4e7' },
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    lineHeight: 1.5,
  },
  headerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    marginBottom: 16,
  },
  brandTag: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metaRight: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'right',
  },
  titleSection: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 6,
  },
  docTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#0f172a',
  },
  docSubtitle: {
    fontSize: 10,
    color: '#475569',
  },
  metaGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 20,
    backgroundColor: '#f8fafc',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7.5,
    color: '#64748b',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  contentSection: {
    marginBottom: 20,
  },
  heading1: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
  },
  heading2: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 9.5,
    marginBottom: 6,
    color: '#334155',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 6,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: '#334155',
  },
  signatureContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  signatureTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  signLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginBottom: 28,
  },
  signName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    paddingTop: 4,
  },
  signStatus: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7.5,
    color: '#94a3b8',
  },
  watermark: {
    position: 'absolute',
    top: 320,
    left: 80,
    right: 80,
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#f1f5f9',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 3,
    transform: 'rotate(-25deg)',
  },
})

/**
 * Parser sederhana untuk Markdown konten deliverable ke elemen React PDF
 */
function parseMarkdownToPdfElements(content: string, themeColor: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <Text
          key={index}
          style={[styles.heading1, { color: themeColor }]}
        >
          {trimmed.replace('# ', '')}
        </Text>
      )
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <Text
          key={index}
          style={[styles.heading2, { color: themeColor }]}
        >
          {trimmed.replace('## ', '')}
        </Text>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <View key={index} style={styles.bulletItem}>
          <Text style={[styles.bulletDot, { color: themeColor }]}>•</Text>
          <Text style={styles.bulletText}>{trimmed.replace(/^[-*]\s+/, '')}</Text>
        </View>
      )
    } else {
      elements.push(
        <Text key={index} style={styles.paragraph}>
          {trimmed}
        </Text>
      )
    }
  })

  return elements
}

export function DeliverablePdfDocument({ options }: { options: DeliverablePdfOptions }) {
  const theme = THEME_COLORS[options.themeColor || 'cobalt']
  const formattedDate = options.createdAt
    ? new Date(options.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

  return (
    <Document
      title={`${options.title} — ${options.clientName}`}
      author={options.authorName || 'Frhm Creative Ops'}
      subject={`Deliverable ${options.deliverableType} untuk ${options.clientName}`}
    >
      <Page size="A4" style={styles.page}>
        {/* WATERMARK */}
        {options.watermarkText && (
          <Text style={styles.watermark}>{options.watermarkText}</Text>
        )}

        {/* HEADER STRIP */}
        <View style={[styles.headerStrip, { borderBottomColor: theme.primary }]}>
          <View>
            <Text style={[styles.brandTag, { color: theme.primary }]}>
              FRHM CREATIVE OPS
            </Text>
            <Text style={{ fontSize: 7.5, color: '#64748b' }}>
              Digital Marketing & Growth Infrastructure
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: '#334155' }}>
              DOKUMEN STRATEGI RESMI
            </Text>
            <Text>Diterbitkan: {formattedDate}</Text>
          </View>
        </View>

        {/* TITLE SECTION */}
        <View style={[styles.titleSection, { backgroundColor: theme.bgSoft, borderWidth: 1, borderColor: theme.border }]}>
          <Text style={styles.docTitle}>{options.title}</Text>
          <Text style={styles.docSubtitle}>
            Disusun khusus untuk kemitraan eksklusif: <Text style={{ fontFamily: 'Helvetica-Bold', color: theme.primary }}>{options.clientName}</Text>
          </Text>
        </View>

        {/* METADATA STRIP */}
        <View style={[styles.metaGrid, { borderColor: theme.border }]}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tipe Deliverable</Text>
            <Text style={styles.metaValue}>{options.deliverableType.toUpperCase()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status Dokumen</Text>
            <Text style={[styles.metaValue, { color: options.status === 'approved' ? '#059669' : theme.primary }]}>
              {options.status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Penyusun</Text>
            <Text style={styles.metaValue}>{options.authorName || 'Frhm Strategy Lead'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Klien</Text>
            <Text style={styles.metaValue}>{options.clientName}</Text>
          </View>
        </View>

        {/* CONTENT SECTIONS */}
        <View style={styles.contentSection}>
          {parseMarkdownToPdfElements(options.contentMarkdown, theme.primary)}
        </View>

        {/* SIGNATURE / SIGN-OFF BLOCK */}
        {options.includeSignatureBlock && (
          <View style={styles.signatureContainer}>
            <Text style={[styles.signatureTitle, { color: theme.primary }]}>
              Lembar Persetujuan & Tanda Tangan Eksekutif
            </Text>
            <View style={styles.signatureRow}>
              <View style={styles.signatureBox}>
                <Text style={styles.signLabel}>PIHAK KLIEN (PERWAKILAN BRAND):</Text>
                <Text style={styles.signName}>{options.clientName}</Text>
                <Text style={styles.signStatus}>
                  Status: {options.status === 'approved' ? 'Telah Disetujui & Divalidasi' : 'Dalam Proses Tinjauan'}
                </Text>
              </View>

              <View style={styles.signatureBox}>
                <Text style={styles.signLabel}>PIHAK FRHM CREATIVE OPS:</Text>
                <Text style={styles.signName}>Bima Maulana Saputra</Text>
                <Text style={styles.signStatus}>Founder & Lead Strategist — Frhm</Text>
              </View>
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Frhm Digital Marketing Platform — Dokumen Rahasia Milik {options.clientName}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

/**
 * Generator Blob PDF untuk unduhan browser atau rendering tab baru.
 */
export async function buildDeliverablePdfBlob(
  options: DeliverablePdfOptions
): Promise<Blob> {
  return await pdf(<DeliverablePdfDocument options={options} />).toBlob()
}
