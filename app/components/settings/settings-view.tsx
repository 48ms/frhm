"use client"

import * as React from "react"
import { useQueryState, parseAsString } from "nuqs"
import { Switch } from "@/components/animate-ui/components/radix/switch"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import { PageContainer } from "@/components/layout/page-container"

const TABS = [
  { id: "workspace", label: "Workspace", icon: "domain" },
  { id: "billing", label: "Billing", icon: "credit_card" },
  { id: "integrations", label: "Integrations", icon: "cable" },
  { id: "user-access", label: "User Access", icon: "shield_person" },
] as const

export function SettingsView() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("workspace"))
  const { client: activeClient } = useActiveDashboard()

  const activeTab = TABS.some((t) => t.id === tab) ? tab : "workspace"

  return (
    <PageContainer
      pageTitle="Agency Configuration & Settings"
      pageDescription={`Manage workspace parameters, billing schedules, API integrations, and collaborative user permissions for ${activeClient?.name ?? "B2B Shell Reps"}.`}
      pageHeaderAction={
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-md px-3 py-2 rounded-full border border-border/30">
          <span className="material-symbols-outlined text-base text-primary">sync</span>
          <span>Last synced: Today at 14:32 WIB</span>
        </div>
      }
      className="pb-20 space-y-8"
    >

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setTab(val)}>
        <TabsList
          aria-label="Settings sections"
          className="flex items-center gap-1.5 p-1 bg-secondary/40 rounded-full border border-border/20 w-max h-auto"
          highlightClassName="bg-card text-foreground shadow-sm rounded-full"
        >
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tab Panels */}
      {activeTab === "workspace" && <WorkspaceTab />}
      {activeTab === "billing" && <BillingTab />}
      {activeTab === "integrations" && <IntegrationsTab />}
      {activeTab === "user-access" && <UserAccessTab />}
    </PageContainer>
  )
}

/* TAB 1: WORKSPACE */

function WorkspaceTab() {
  const [agencyName, setAgencyName] = React.useState("FRHM Creative Orchestrations Ltd.")
  const [slug, setSlug] = React.useState("b2b-shell")
  const [timezone, setTimezone] = React.useState("UTC+7 Bangkok/Jakarta (WIB)")
  const [currency, setCurrency] = React.useState("USD ($) - United States Dollar")

  const [strictGate, setStrictGate] = React.useState(true)
  const [aiCaption, setAiCaption] = React.useState(true)
  const [proQuality, setProQuality] = React.useState(true)
  const [retention, setRetention] = React.useState("365")

  return (
    <div className="space-y-8">
      {/* Section 1.1: Agency Workspace Profile */}
      <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-border/20 pb-5 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Agency Workspace Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              General organizational metadata, regional dispatch routing, and client billing
              identifiers.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-lum-secondary-fixed-dim text-lum-on-primary text-xs font-semibold">
            ID: WS-88910
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">
              Agency Legal Entity Name
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full h-12 px-5 rounded-full bg-muted/60 border border-border/40 text-foreground text-sm focus:bg-card focus:ring-2 focus:ring-secondary focus:outline-none transition-all"
            />
            <p className="text-xs text-muted-foreground">
              Used on legal statements, automated NDA dispatches, and commercial invoices.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">Workspace URL Slug</label>
            <div className="flex items-center rounded-full bg-muted/60 border border-border/40 overflow-hidden focus-within:ring-2 focus-within:ring-secondary focus-within:bg-card">
              <span className="pl-5 pr-1 text-sm text-muted-foreground select-none">
                frhm.agency/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 h-12 pr-5 pl-0 bg-transparent border-0 text-foreground text-sm focus:ring-0 focus:outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Custom subdomain link for direct client review portals and proof approvals.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">
              Default Dispatch Timezone
            </label>
            <Tabs value={timezone} onValueChange={setTimezone}>
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 h-11 p-1 bg-muted/60 border border-border/40 rounded-xl">
                <TabsTrigger value="UTC+7 Bangkok/Jakarta (WIB)" className="text-xs font-bold rounded-lg py-1.5">WIB (UTC+7)</TabsTrigger>
                <TabsTrigger value="UTC+0 London / GMT" className="text-xs font-bold rounded-lg py-1.5">GMT (UTC+0)</TabsTrigger>
                <TabsTrigger value="UTC-5 New York / EST" className="text-xs font-bold rounded-lg py-1.5">EST (UTC-5)</TabsTrigger>
                <TabsTrigger value="UTC+8 Singapore / SGT" className="text-xs font-bold rounded-lg py-1.5">SGT (UTC+8)</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              Determines scheduling slots, prime audience heatmaps, and content calendar drops.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">Primary Currency</label>
            <Tabs value={currency} onValueChange={setCurrency}>
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 h-11 p-1 bg-muted/60 border border-border/40 rounded-xl">
                <TabsTrigger value="USD ($) - United States Dollar" className="text-xs font-bold rounded-lg py-1.5">USD ($)</TabsTrigger>
                <TabsTrigger value="EUR (€) - Eurozone" className="text-xs font-bold rounded-lg py-1.5">EUR (€)</TabsTrigger>
                <TabsTrigger value="GBP (£) - British Pound" className="text-xs font-bold rounded-lg py-1.5">GBP (£)</TabsTrigger>
                <TabsTrigger value="SGD (S$) - Singapore Dollar" className="text-xs font-bold rounded-lg py-1.5">SGD (S$)</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              Standardized currency for media buying estimations and client budget tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1.2: Media Operations & Auto-Publishing */}
      <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-border/20 pb-5 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Media Operations &amp; Auto-Publishing
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Safeguards, automated content pipelines, and retention lifecycle rules.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/40 border border-primary-container text-foreground text-1xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Active Pipeline Guard
          </div>
        </div>

        <div className="space-y-6">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/25">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Strict Client Approval Gate
                </span>
                <span className="px-2 py-0.5 rounded text-2xs font-bold bg-muted text-foreground">
                  Mandatory
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enforce explicit client sign-off before any Instagram Reel, YouTube Short, or TikTok
                post is queued for final production dispatch.
              </p>
            </div>
            <Switch checked={strictGate} onCheckedChange={setStrictGate} className="shrink-0" />
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/25">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  AI Caption Auto-Optimization
                </span>
                <span className="px-2 py-0.5 rounded text-2xs font-bold bg-lum-tertiary-fixed-dim text-lum-on-primary">
                  Smart Dispatch
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enhance hashtags, engagement hooks, and audience-specific emojis dynamically upon
                release dispatch based on real-time platform trends.
              </p>
            </div>
            <Switch checked={aiCaption} onCheckedChange={setAiCaption} className="shrink-0" />
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/25">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  High-Bandwidth 4K Video Preservation
                </span>
                <span className="px-2 py-0.5 rounded text-2xs font-bold bg-lum-secondary-fixed-dim text-lum-on-primary">
                  Pro Quality
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Retain original ProRes/MP4 bitrate for TikTok &amp; Instagram Reels uploads without
                downstream compression degradation.
              </p>
            </div>
            <Switch checked={proQuality} onCheckedChange={setProQuality} className="shrink-0" />
          </div>

          {/* Retention Period Radio Selector */}
          <div className="pt-4 border-t border-border/20">
            <label className="text-sm font-semibold text-foreground block mb-3">
              Default Content Retention Period
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: "90", label: "90 Days" },
                { value: "180", label: "180 Days" },
                { value: "365", label: "1 Year (Standard)" },
                { value: "unlimited", label: "Unlimited Cloud" },
              ].map((opt) => {
                const isActive = retention === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-full cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary-container/20 border-2 border-primary-container"
                        : "bg-muted/50 border border-border/30 hover:bg-card"
                    }`}
                  >
                    <input
                      type="radio"
                      name="retention"
                      value={opt.value}
                      checked={isActive}
                      onChange={() => setRetention(opt.value)}
                      className="w-4 h-4 ml-1 accent-primary"
                    />
                    <span
                      className={`text-sm text-foreground ${isActive ? "font-bold" : "font-medium"}`}
                    >
                      {opt.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* TAB 2: BILLING */

function BillingTab() {
  return (
    <div className="space-y-8">
      {/* Plan & Overview Card */}
      <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border/20 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lum-secondary-fixed-dim text-lum-on-primary text-1xs font-semibold mb-3">
              Active Subscription
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Enterprise Multi-Seat Agency Tier
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Next billing renewal scheduled on{" "}
              <span className="font-semibold text-foreground">August 14, 2026</span> via primary
              payment source.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                toast.info("Halaman Invoice", {
                  description: "Invoice tersedia di menu ERP → Budgets & Expenses. Unduh langsung dari sana.",
                })
              }
              className="px-5 py-2.5 rounded-full bg-card border border-border/40 text-foreground text-sm hover:bg-muted/40 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              Download Tax Invoices
            </button>
            <button
              type="button"
              onClick={() => toast.info("Menu Upgrade Quota", { description: "Hubungi admin untuk peninjauan plan dan penambahan kuota." })}
              className="px-6 py-2.5 rounded-full bg-primary-container text-foreground text-sm font-bold hover:shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">bolt</span>
              Upgrade Quota
            </button>
          </div>
        </div>

        {/* Payment Method & Invoice Quick Row */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold text-xs">
                MC
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Mastercard ending in 8842</p>
                <p className="text-xs text-muted-foreground">
                  Expires 11/28 · Primary Corporate Billing Card
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Manajemen Billing", { description: "Gunakan portal payment gateway terintegrasi untuk ubah metode pembayaran." })}
              className="text-xs text-secondary font-semibold hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lum-tertiary text-2xl">verified</span>
              <div>
                <p className="text-sm font-bold text-foreground">Tax Exemption #EU-88290-X</p>
                <p className="text-xs text-muted-foreground">
                  Reverse Charge VAT Applied · Status Valid
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-muted text-foreground text-xs font-semibold">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Resource Metric Meters Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Connected Workspaces */}
        <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-1xs font-semibold text-muted-foreground">
                Resource Meter
              </span>
              <span className="p-2 rounded-full bg-muted/60 text-foreground">
                <span className="material-symbols-outlined text-lg">group_work</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">Connected Workspaces</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-client isolated partitions.
            </p>
            <div className="my-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-foreground">
                  3 <span className="text-base font-normal text-muted-foreground">/ 10</span>
                </span>
                <span className="text-sm font-semibold text-secondary">30% Used</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: "30%" }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/20">
            7 additional client seats available.
          </p>
        </div>

        {/* Metric 2: API Webhook Dispatches */}
        <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-1xs font-semibold text-muted-foreground">
                Throughput
              </span>
              <span className="p-2 rounded-full bg-primary-container text-foreground">
                <span className="material-symbols-outlined text-lg">bolt</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">API Webhook Dispatches</h3>
            <p className="text-xs text-muted-foreground mt-1">Monthly automated trigger events.</p>
            <div className="my-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-foreground">
                  84.2k <span className="text-base font-normal text-muted-foreground">/ 100k</span>
                </span>
                <span className="text-sm font-semibold text-primary">84% Used</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary-container rounded-full" style={{ width: "84%" }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-destructive font-medium pt-2 border-t border-border/20">
            Approaching 85% soft threshold.
          </p>
        </div>

        {/* Metric 3: Cloud Video Storage */}
        <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-1xs font-semibold text-muted-foreground">
                Object Vault
              </span>
              <span className="p-2 rounded-full bg-lum-tertiary-container text-lum-tertiary">
                <span className="material-symbols-outlined text-lg">cloud</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">Cloud Video Storage</h3>
            <p className="text-xs text-muted-foreground mt-1">High-bitrate master library.</p>
            <div className="my-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-foreground">
                  2.4 TB <span className="text-base font-normal text-muted-foreground">/ 5 TB</span>
                </span>
                <span className="text-sm font-semibold text-lum-tertiary">48% Used</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-lum-tertiary rounded-full" style={{ width: "48%" }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/20">
            ProRes &amp; 4K proxy cache optimized.
          </p>
        </div>
      </div>
    </div>
  )
}

/* TAB 3: INTEGRATIONS */

function IntegrationsTab() {
  const [secretVisible, setSecretVisible] = React.useState(false)
  const secret = "whsec_88f9182390a1bcde01f92aa734cd99120ff98"

  const integrations = [
    {
      badge: "M",
      badgeClass: "bg-lum-secondary-fixed-dim text-secondary",
      title: "Meta Graph API v19.0",
      status: "CONNECTED",
      action: "Re-authenticate",
      desc: (
        <>
          OAuth token valid for 58 days · Auto-renew token cycle enabled for Instagram Professional
          &amp; Facebook Pages.
        </>
      ),
      enabled: true,
    },
    {
      badge: "TT",
      badgeClass: "bg-foreground text-background",
      title: "TikTok Open API & Commercial Content Engine",
      status: "CONNECTED",
      action: "Permissions",
      desc: (
        <>
          Linked to Spark Ads Manager · Real-time sound licensing verification enabled for corporate
          campaigns.
        </>
      ),
      enabled: true,
    },
    {
      badge: "forum",
      badgeClass: "bg-lum-tertiary-container text-lum-tertiary material-symbols-outlined",
      title: "Slack / Discord Dispatch Webhook",
      status: "ACTIVE",
      action: "Test Alert",
      desc: (
        <>
          Direct channel alerts configured to{" "}
          <code className="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
            #client-b2b-shell-alerts
          </code>
          .
        </>
      ),
      enabled: true,
    },
    {
      badge: "send",
      badgeClass:
        "bg-lum-secondary-fixed-dim text-lum-on-primary material-symbols-outlined",
      title: "Telegram Real-time Approval Bot",
      status: "ONLINE",
      action: "Configure Commands",
      desc: (
        <>
          Active gateway:{" "}
          <span className="font-semibold text-foreground">@FrhmAgencyDispatcherBot</span> for
          executive fast-path approvals.
        </>
      ),
      enabled: true,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Integrations List */}
      <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-8 shadow-sm">
        <div className="border-b border-border/20 pb-5 mb-6">
          <h2 className="text-xl font-bold text-foreground">Connected Social &amp; Ops Channels</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Third-party platform authorization, direct feed links, and programmatic dispatch hooks.
          </p>
        </div>

        <div className="space-y-4">
          {integrations.map((it) => (
            <IntegrationRow key={it.title} {...it} />
          ))}
        </div>
      </div>

      {/* Webhook Signing Secret */}
      <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-border/20 pb-5 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Webhook Signing &amp; Cryptographic Keys
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Verify downstream dispatch authenticity on your custom agency middleware endpoint.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.success("Test Ping Sent", { description: "Webhook endpoint menerima ping dengan success 200." })}
            className="px-4 py-2 rounded-full bg-lum-secondary-fixed-dim text-lum-on-primary text-sm font-semibold hover:bg-lum-secondary-fixed-dim/80 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-lg">network_ping</span>
            Send Test Ping
          </button>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-foreground block">
            Live Webhook Signing Secret (HMAC-SHA256)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                readOnly
                type={secretVisible ? "text" : "password"}
                value={secret}
                className="w-full h-12 px-5 font-mono text-sm bg-muted/60 border border-border/40 rounded-full text-foreground select-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
              <button
                type="button"
                onClick={() => setSecretVisible((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={secretVisible ? "Hide secret" : "Show secret"}
              >
                <span className="material-symbols-outlined text-xl">
                  {secretVisible ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(secret)
                toast.success("Signing secret copied to clipboard.")
              }}
              className="h-12 px-6 rounded-full bg-card border border-border/60 hover:bg-muted/40 text-foreground text-sm font-bold transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
              Copy Secret
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Never expose this secret in client-side code repositories. Rotate keys immediately if
            compromised.
          </p>
        </div>
      </div>
    </div>
  )
}

function IntegrationRow({
  badge,
  badgeClass,
  title,
  status,
  action,
  desc,
  enabled,
}: {
  badge: string
  badgeClass: string
  title: string
  status: string
  action: string
  desc: React.ReactNode
  enabled: boolean
}) {
  const [on, setOn] = React.useState(enabled)
  return (
    <div className="p-5 rounded-2xl bg-muted/40 border border-border/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${badgeClass}`}
        >
          {badge}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-foreground text-1xs font-bold">
              {status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
        <button
          type="button"
          onClick={() =>
            toast.info(`${action} · ${title}`, {
              description: "Kelola detail integrasi ini dari dashboard platform terkait.",
            })
          }
          className="px-4 py-2 rounded-full border border-border/40 bg-card text-foreground text-xs font-semibold hover:bg-muted/40 transition-colors"
        >
          {action}
        </button>
        <Switch checked={on} onCheckedChange={setOn} />
      </div>
    </div>
  )
}

/* TAB 4: USER ACCESS */

function UserAccessTab() {
  const [enforce2fa, setEnforce2fa] = React.useState(true)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("Content Creator")

  const members = [
    {
      initials: "AV",
      avatarClass: "bg-lum-secondary-fixed-dim text-lum-on-primary",
      name: "Amara Vance",
      isYou: true,
      email: "amara.v@frhm.agency",
      role: "Studio Director",
      roleLocked: true,
      roleClass: "bg-lum-secondary-fixed-dim text-lum-on-primary",
      twofa: "Hardware Token (YubiKey)",
      twofaIcon: "verified_user",
      twofaClass: "text-primary",
      access: "Full Global Root",
      action: "Protected",
    },
    {
      initials: "JC",
      avatarClass: "bg-primary-container text-foreground",
      name: "Julian Chen",
      isYou: false,
      email: "julian.c@frhm.agency",
      role: "Campaign Lead",
      roleLocked: false,
      twofa: "Google Authenticator",
      twofaIcon: "check_circle",
      twofaClass: "text-primary",
      access: "Publish & Schedule",
      action: "Revoke",
    },
    {
      initials: "MT",
      avatarClass: "bg-lum-tertiary-fixed-dim text-lum-on-primary",
      name: "Maya Thorne",
      isYou: false,
      email: "maya.t@frhm.agency",
      role: "Content Creator",
      roleLocked: false,
      twofa: "Google Authenticator",
      twofaIcon: "check_circle",
      twofaClass: "text-primary",
      access: "Draft & Render Only",
      action: "Revoke",
    },
    {
      initials: "DH",
      avatarClass: "bg-muted text-foreground",
      name: "Derrick Holt",
      isYou: false,
      email: "d.holt@shellreps-corp.com",
      role: "Client Guest Reviewer",
      roleLocked: true,
      roleClass: "bg-muted text-foreground",
      twofa: "SMS Backup (Pending App)",
      twofaIcon: "sms",
      twofaClass: "text-muted-foreground",
      access: "Approval Gate Only",
      action: "Revoke",
    },
  ]

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Enter a collaborator email first.")
      return
    }
    toast.success(`Invite sent to ${inviteEmail}`, { description: `Role: ${inviteRole}` })
    setInviteEmail("")
  }

  return (
    <div className="space-y-8">
      {/* SSO & Security Controls */}
      <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Security &amp; Single Sign-On (SSO)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enforce agency compliance protocols and multi-factor authentication mandates.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-lum-tertiary-fixed-dim text-lum-on-primary text-1xs font-bold">
            SOC-2 Type II Compliant
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/30">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                Mandatory Google Workspace 2FA for all team members
              </span>
              <span className="px-2 py-0.5 rounded text-2xs font-bold bg-primary-container text-foreground">
                Enforced
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Reject login requests from accounts lacking active physical security key or
              authenticator app 2FA.
            </p>
          </div>
          <Switch checked={enforce2fa} onCheckedChange={setEnforce2fa} className="shrink-0" />
        </div>
      </div>

      {/* Team Roster & Invite */}
      <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Collaborator Matrix &amp; Permissions
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              4 active members provisioned for{" "}
              <span className="font-semibold text-foreground">B2B Shell Reps</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.info("Form Tambah Anggota", { description: "Gunakan baris input cepat di bawah untuk mengundang anggota." })}
            className="px-5 py-2.5 rounded-full bg-primary-container text-foreground text-sm font-bold hover:shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            + Invite Collaborator
          </button>
        </div>

        {/* Quick Invite Input Bar */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/25 mb-6 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
              mail
            </span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@agency-or-client.com"
              className="w-full h-11 pl-10 pr-4 rounded-full bg-card border border-border/30 text-sm text-foreground focus:ring-2 focus:ring-secondary focus:outline-none"
            />
          </div>
          <div className="w-full md:w-auto flex-1">
            <Tabs value={inviteRole} onValueChange={setInviteRole}>
              <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-11 p-1 bg-muted/60 border border-border/30 rounded-xl">
                <TabsTrigger value="Content Creator" className="text-xs font-bold rounded-lg py-1.5">Creator</TabsTrigger>
                <TabsTrigger value="Campaign Lead" className="text-xs font-bold rounded-lg py-1.5">Lead</TabsTrigger>
                <TabsTrigger value="Client Guest Reviewer" className="text-xs font-bold rounded-lg py-1.5">Reviewer</TabsTrigger>
                <TabsTrigger value="Studio Director" className="text-xs font-bold rounded-lg py-1.5">Director</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <button
            type="button"
            onClick={handleInvite}
            className="w-full md:w-auto h-11 px-6 rounded-full bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-all shrink-0"
          >
            Send Invite
          </button>
        </div>

        {/* Team Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/30 text-muted-foreground text-1xs font-semibold">
                <th className="py-3 px-4">Member Name &amp; Email</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">2FA Status</th>
                <th className="py-3 px-4">Workspace Access</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {members.map((m) => (
                <tr key={m.email} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${m.avatarClass}`}
                      >
                        {m.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {m.name}
                          {m.isYou && (
                            <span className="ml-1 text-xs text-secondary font-normal">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {m.roleLocked ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${m.roleClass}`}
                      >
                        {m.role}
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-8 px-3 rounded-full bg-muted/60 hover:bg-muted border border-border/30 text-xs font-medium text-foreground inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>{m.role}</span>
                            <span className="material-symbols-outlined text-xs">expand_more</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem onClick={() => toast.success(`Role ${m.name} diubah ke Campaign Lead`)}>
                            Campaign Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success(`Role ${m.name} diubah ke Content Creator`)}>
                            Content Creator
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success(`Role ${m.name} diubah ke Client Guest Reviewer`)}>
                            Client Guest Reviewer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${m.twofaClass}`}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {m.twofaIcon}
                      </span>
                      {m.twofa}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground text-xs">{m.access}</td>
                  <td className="py-4 px-4 text-right">
                    {m.action === "Protected" ? (
                      <span className="text-muted-foreground cursor-not-allowed text-xs font-semibold">
                        Protected
                      </span>
                    ) : (
                      <button
                        type="button"
                        title="Revoke Access"
                        onClick={() => toast.success(`Akses untuk ${m.name} dicabut.`)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <span className="material-symbols-outlined text-lg">
                          person_remove
                        </span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
