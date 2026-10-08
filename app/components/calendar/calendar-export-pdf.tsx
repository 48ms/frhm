/**
 * PDF schedule export: memakai @react-pdf/renderer.
 * Diimpor dinamis agar tidak membebani bundle utama.
 */

import React from "react"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"
import { PLATFORMS } from "@/features/calendar/types"

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  h1: { fontSize: 16, marginBottom: 4 },
  meta: { fontSize: 9, color: "#555555", marginBottom: 14 },
  headRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#111111", paddingVertical: 4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e5e5", paddingVertical: 4 },
  cell: { flex: 1 },
  strong: { fontFamily: "Helvetica-Bold" },
})

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

function ScheduleDoc({
  clientName,
  posts,
  rangeLabel,
}: {
  clientName: string
  posts: ScheduledPost[]
  rangeLabel: string
}) {
  return (
    <Document title={`Jadwal Konten: ${clientName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Jadwal Konten: {clientName}</Text>
        <Text style={styles.meta}>
          Rentang: {rangeLabel} · {posts.length} post
        </Text>
        <View style={styles.headRow}>
          <Text style={[styles.cell, styles.strong]}>Tanggal</Text>
          <Text style={[styles.cell, styles.strong]}>Jam</Text>
          <Text style={[styles.cell, styles.strong]}>Judul</Text>
          <Text style={[styles.cell, styles.strong]}>Platform</Text>
          <Text style={[styles.cell, styles.strong]}>Status</Text>
        </View>
        {posts.map((p) => (
          <View key={p.id} style={styles.row}>
            <Text style={styles.cell}>{fmtDate(p.scheduled_at)}</Text>
            <Text style={styles.cell}>{fmtTime(p.scheduled_at)}</Text>
            <Text style={styles.cell}>{p.title}</Text>
            <Text style={styles.cell}>{PLATFORMS[p.platform]?.name ?? p.platform}</Text>
            <Text style={styles.cell}>{p.status}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}

export async function buildSchedulePdfBlob(
  clientName: string,
  posts: ScheduledPost[],
  rangeLabel: string
): Promise<Blob> {
  return await pdf(<ScheduleDoc clientName={clientName} posts={posts} rangeLabel={rangeLabel} />).toBlob()
}
