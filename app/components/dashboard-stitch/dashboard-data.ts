"use client"

// Dummy dashboard data derived from the social-accounts client roster so the
// dashboard, hero, chart and right-panel all speak about the SAME active client.
import { useQueryState, parseAsString } from "nuqs"
import { SOCIAL_CLIENTS, type SocialClient } from "@/components/social-accounts/social-data"

export type Timeframe = "7d" | "30d" | "90d"

export type DashboardMetric = {
  label: string
  value: string
  delta: string
  trend: "up" | "down"
  /** Relative sparkline heights, 0-100, rendered as mini bars. */
  spark: number[]
}

export type DashboardProfile = {
  /** Headline greeting subject, e.g. "B2B Shell". */
  greeting: string
  velocity: number
  peakLabel: string
  peakValue: string
  /** Two SVG paths (reach + engagement) per timeframe. */
  charts: Record<Timeframe, { reach: string; engage: string }>
  insights: { label: string; value: string; sub: string }[]
  metrics: DashboardMetric[]
}

const PROFILES: Record<string, DashboardProfile> = {
  "client-shell": {
    greeting: "B2B Shell",
    velocity: 98,
    peakLabel: "Peak: Friday +34%",
    peakValue: "248.5K",
    charts: {
      "7d": {
        reach: "M0,150 C70,130 130,60 210,95 C290,130 370,40 450,75 C530,110 580,30 600,45",
        engage: "M0,175 C90,155 160,115 240,135 C320,150 400,95 480,105 C550,115 580,85 600,95",
      },
      "30d": {
        reach: "M0,165 C80,140 140,50 220,90 C300,130 380,30 460,70 C540,110 580,20 600,40",
        engage: "M0,180 C90,160 160,110 240,130 C320,150 400,90 480,100 C550,110 580,80 600,90",
      },
      "90d": {
        reach: "M0,175 C60,150 120,120 200,80 C280,45 360,60 440,35 C520,15 580,25 600,20",
        engage: "M0,185 C80,175 150,150 230,140 C310,128 390,105 470,95 C550,85 585,70 600,65",
      },
    },
    insights: [
      { label: "TOP PERFORMING FORMAT", value: "Short Reels", sub: "8.4x retention multiplier" },
      { label: "VIRAL DRIFT SCORE", value: "94 / 100", sub: "Algorithmic favoritism high" },
      { label: "AUDIENCE REACTION", value: "98.2% Positive", sub: "Sentiment peak" },
    ],
    metrics: [
      { label: "Aggregate Reach", value: "4.5M", delta: "+18.2%", trend: "up", spark: [40, 55, 48, 70, 62, 85, 92] },
      { label: "Engagement Rate", value: "6.8%", delta: "+0.9pt", trend: "up", spark: [50, 48, 60, 58, 72, 70, 80] },
      { label: "Content Velocity", value: "42 / wk", delta: "+7", trend: "up", spark: [30, 45, 42, 55, 60, 66, 74] },
      { label: "Inbound Inquiries", value: "318", delta: "-4.1%", trend: "down", spark: [80, 74, 78, 66, 70, 62, 58] },
    ],
  },
  "client-wizard": {
    greeting: "E2E Wizard",
    velocity: 87,
    peakLabel: "Peak: Wednesday +21%",
    peakValue: "182.3K",
    charts: {
      "7d": {
        reach: "M0,140 C70,150 130,90 210,110 C290,120 370,60 450,85 C530,105 580,55 600,60",
        engage: "M0,170 C90,160 160,130 240,140 C320,150 400,110 480,120 C550,125 580,95 600,100",
      },
      "30d": {
        reach: "M0,150 C80,130 140,80 220,70 C300,60 380,85 460,55 C540,35 580,50 600,45",
        engage: "M0,175 C90,165 160,140 240,120 C320,110 400,125 480,95 C550,80 580,90 600,85",
      },
      "90d": {
        reach: "M0,170 C60,155 120,110 200,95 C280,80 360,70 440,50 C520,35 580,40 600,30",
        engage: "M0,185 C80,170 150,145 230,130 C310,115 390,110 470,90 C550,75 585,80 600,70",
      },
    },
    insights: [
      { label: "TOP PERFORMING FORMAT", value: "Dev Tutorials", sub: "6.1x retention multiplier" },
      { label: "VIRAL DRIFT SCORE", value: "88 / 100", sub: "Strong technical virality" },
      { label: "AUDIENCE REACTION", value: "96.4% Positive", sub: "Developer sentiment high" },
    ],
    metrics: [
      { label: "Aggregate Reach", value: "3.1M", delta: "+12.7%", trend: "up", spark: [35, 42, 50, 55, 60, 68, 78] },
      { label: "Engagement Rate", value: "5.2%", delta: "+0.4pt", trend: "up", spark: [45, 50, 48, 58, 62, 60, 68] },
      { label: "Content Velocity", value: "31 / wk", delta: "+3", trend: "up", spark: [28, 34, 40, 44, 50, 52, 58] },
      { label: "Inbound Inquiries", value: "214", delta: "+6.8%", trend: "up", spark: [40, 46, 52, 50, 62, 70, 76] },
    ],
  },
  "client-aura": {
    greeting: "Aura Luxury",
    velocity: 93,
    peakLabel: "Peak: Saturday +28%",
    peakValue: "311.7K",
    charts: {
      "7d": {
        reach: "M0,130 C70,120 130,70 210,60 C290,55 370,80 450,45 C530,20 580,35 600,30",
        engage: "M0,160 C90,150 160,120 240,110 C320,100 400,115 480,85 C550,65 580,75 600,68",
      },
      "30d": {
        reach: "M0,145 C80,120 140,60 220,55 C300,50 380,70 460,40 C540,15 580,30 600,25",
        engage: "M0,170 C90,155 160,120 240,105 C320,95 400,110 480,80 C550,60 580,70 600,60",
      },
      "90d": {
        reach: "M0,165 C60,140 120,100 200,75 C280,55 360,60 440,35 C520,12 580,25 600,15",
        engage: "M0,180 C80,165 150,135 230,115 C310,100 390,100 470,75 C550,55 585,60 600,50",
      },
    },
    insights: [
      { label: "TOP PERFORMING FORMAT", value: "Lookbooks", sub: "9.7x retention multiplier" },
      { label: "VIRAL DRIFT SCORE", value: "97 / 100", sub: "Haute couture virality peak" },
      { label: "AUDIENCE REACTION", value: "99.1% Positive", sub: "Luxury sentiment peak" },
    ],
    metrics: [
      { label: "Aggregate Reach", value: "5.8M", delta: "+24.5%", trend: "up", spark: [48, 58, 62, 72, 78, 88, 96] },
      { label: "Engagement Rate", value: "8.1%", delta: "+1.3pt", trend: "up", spark: [55, 60, 66, 70, 76, 82, 90] },
      { label: "Content Velocity", value: "27 / wk", delta: "+2", trend: "up", spark: [32, 38, 42, 48, 52, 58, 64] },
      { label: "Inbound Inquiries", value: "486", delta: "+11.4%", trend: "up", spark: [50, 55, 62, 68, 74, 84, 92] },
    ],
  },
}

/** Every client shares the shell profile until it gets its own entry. */
function profileFor(id: string): DashboardProfile {
  return PROFILES[id] ?? PROFILES["client-shell"]
}

export function useDashboardProfile(clientId: string): DashboardProfile {
  return profileFor(clientId)
}

/**
 * Single source of truth for the dashboard: the active client lives in the URL
 * (`?clientId=`) so hero, KPIs, chart and right-panel stay in lockstep, and a
 * refresh restores the exact same client view.
 */
export function useActiveDashboard() {
  const [clientId, setClientId] = useQueryState(
    "clientId",
    parseAsString.withDefault(SOCIAL_CLIENTS[0].id)
  )
  const client =
    SOCIAL_CLIENTS.find((c) => c.id === clientId) ?? SOCIAL_CLIENTS[0]
  const profile = profileFor(client.id)
  return { clientId: client.id, setClientId, client, profile, clients: SOCIAL_CLIENTS }
}

export const DASHBOARD_CLIENTS: SocialClient[] = SOCIAL_CLIENTS
