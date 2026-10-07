/**
 * PDF report builder — memakai @react-pdf/renderer (sudah ada di dependensi).
 * Modul ini diimpor secara dinamis agar tidak membebani bundle utama.
 * Isi laporan berasal dari ReportModel yang dibangun dari metrik nyata.
 */

import React from "react"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"
import type { ReportModel } from "./report-generator"

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  h1: { fontSize: 18, marginBottom: 4 },
  meta: { fontSize: 9, color: "#555555", marginBottom: 16 },
  section: { fontSize: 12, marginTop: 16, marginBottom: 6 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e5e5", paddingVertical: 4 },
  headRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#111111", paddingVertical: 4 },
  cell: { flex: 1 },
  cellNarrow: { width: 70 },
  strong: { fontFamily: "Helvetica-Bold" },
})

const n = (v: number) => v.toLocaleString("id-ID")

function ReportDoc({ model }: { model: ReportModel }) {
  return (
    <Document title={`Laporan Performa — ${model.clientName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Laporan Performa — {model.clientName}</Text>
        <Text style={styles.meta}>
          Rentang: {model.range} · Dibuat {model.generatedAt}
        </Text>

        <Text style={styles.section}>Ringkasan</Text>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.strong]}>Post tercatat</Text>
          <Text style={styles.cell}>{n(model.totals.posts)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.strong]}>Reach</Text>
          <Text style={styles.cell}>{n(model.totals.reach)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.strong]}>Views</Text>
          <Text style={styles.cell}>{n(model.totals.views)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.strong]}>Engagement</Text>
          <Text style={styles.cell}>{n(model.totals.engagement)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.strong]}>WA inquiries</Text>
          <Text style={styles.cell}>{n(model.totals.waInquiries)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.strong]}>DM inquiries</Text>
          <Text style={styles.cell}>{n(model.totals.dmInquiries)}</Text>
        </View>

        <Text style={styles.section}>Per platform</Text>
        <View style={styles.headRow}>
          <Text style={[styles.cell, styles.strong]}>Platform</Text>
          <Text style={[styles.cellNarrow, styles.strong]}>Posts</Text>
          <Text style={[styles.cellNarrow, styles.strong]}>Reach</Text>
          <Text style={[styles.cellNarrow, styles.strong]}>Eng.</Text>
        </View>
        {model.byPlatform.map((p) => (
          <View key={p.platform} style={styles.row}>
            <Text style={styles.cell}>{p.platform}</Text>
            <Text style={styles.cellNarrow}>{n(p.posts)}</Text>
            <Text style={styles.cellNarrow}>{n(p.reach)}</Text>
            <Text style={styles.cellNarrow}>{n(p.engagement)}</Text>
          </View>
        ))}

        {model.insights.length > 0 && (
          <>
            <Text style={styles.section}>Catatan AI</Text>
            {model.insights.map((insight, i) => (
              <Text key={i} style={{ marginBottom: 4 }}>
                • {insight}
              </Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  )
}

export async function buildPdfBlob(model: ReportModel): Promise<Blob> {
  return await pdf(<ReportDoc model={model} />).toBlob()
}
