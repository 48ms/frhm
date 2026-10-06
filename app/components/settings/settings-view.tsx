"use client"

import * as React from "react"
import { useQueryState, parseAsString } from "nuqs"
import { Switch } from "@/components/ui/switch"
import { SOCIAL_CLIENTS } from "@/components/social-accounts/social-data"
import { toast } from "sonner"

const TABS = [
  { id: "workspace", label: "Workspace", icon: "domain" },
  { id: "billing", label: "Billing", icon: "credit_card" },
  { id: "integrations", label: "Integrations", icon: "cable" },
  { id: "user-access", label: "User Access", icon: "shield_person" },
] as const

export function SettingsView() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("workspace"))
  const [clientId] = useQueryState("clientId", parseAsString.withDefault(SOCIAL_CLIENTS[0].id))

  const activeClient = React.useMemo(
    () => SOCIAL_CLIENTS.find((c) => c.id === clientId) ?? SOCIAL_CLIENTS[0],
    [clientId]
  )

  const activeTab = TABS.some((t) => t.id === tab) ? tab : "workspace"

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            Workspace Administration
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Agency Configuration &amp; Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-3xl">
            Manage workspace parameters, billing schedules, API integrations, and collaborative user
            permissions for{" "}
            <span className="font-semibold text-foreground">
              {activeClient?.name ?? "B2B Shell Reps"}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto text-xs text-muted-foreground bg-card/80 backdrop-blur-md px-3 py-2 rounded-full border border-border/30">
          <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
          <span>Last synced: Today at 14:32 WIB</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div role="tablist" aria-label="Settings sections" className="flex border-b border-border/20 gap-8">
        {TABS.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.id)}
              className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "workspace" && <WorkspaceTab />}
      {activeTab === "billing" && <BillingTab />}
      {activeTab === "integrations" && <IntegrationsTab />}
      {activeTab === "user-access" && <UserAccessTab />}
    </div>
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
          <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
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
              className="w-full h-12 px-5 rounded-full bg-muted/60/60 border border-border/40 text-foreground text-sm focus:bg-card focus:ring-2 focus:ring-secondary focus:outline-none transition-all"
            />
            <p className="text-xs text-muted-foreground">
              Used on legal statements, automated NDA dispatches, and commercial invoices.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">Workspace URL Slug</label>
            <div className="flex items-center rounded-full bg-muted/60/60 border border-border/40 overflow-hidden focus-within:ring-2 focus-within:ring-secondary focus-within:bg-card">
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
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-12 px-5 rounded-full bg-muted/60/60 border border-border/40 text-foreground text-sm focus:bg-card focus:ring-2 focus:ring-secondary focus:outline-none cursor-pointer"
            >
              <option>UTC+7 Bangkok/Jakarta (WIB)</option>
              <option>UTC+0 London / GMT</option>
              <option>UTC-5 New York / EST</option>
              <option>UTC+8 Singapore / SGT</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Determines scheduling slots, prime audience heatmaps, and content calendar drops.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">Primary Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-12 px-5 rounded-full bg-muted/60/60 border border-border/40 text-foreground text-sm focus:bg-card focus:ring-2 focus:ring-secondary focus:outline-none cursor-pointer"
            >
              <option>USD ($) - United States Dollar</option>
              <option>EUR (€) - Eurozone</option>
              <option>GBP (£) - British Pound</option>
              <option>SGD (S$) - Singapore Dollar</option>
            </select>
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
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/40 border border-primary-container text-foreground text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Active Pipeline Guard
          </div>
        </div>

        <div className="space-y-6">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/60/40 border border-border/25">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Strict Client Approval Gate
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-highest text-foreground">
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/60/40 border border-border/25">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  AI Caption Auto-Optimization
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed text-on-tertiary-fixed">
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/60/40 border border-border/25">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  High-Bandwidth 4K Video Preservation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary-fixed text-on-secondary-fixed">
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
                        : "bg-muted/60/50 border border-border/30 hover:bg-card"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold uppercase mb-3">
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
            <button className="px-5 py-2.5 rounded-full bg-card border border-border/40 text-foreground text-sm hover:bg-surface-container-high/40 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Download Tax Invoices
            </button>
            <button className="px-6 py-2.5 rounded-full bg-primary-container text-foreground text-sm font-bold hover:shadow-md transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              Upgrade Quota
            </button>
          </div>
        </div>

        {/* Payment Method & Invoice Quick Row */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/60/40 border border-border/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 rounded bg-on-surface text-surface-container-lowest flex items-center justify-center font-bold text-xs tracking-wider">
                MC
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Mastercard ending in 8842</p>
                <p className="text-xs text-muted-foreground">
                  Expires 11/28 · Primary Corporate Billing Card
                </p>
              </div>
            </div>
            <button className="text-xs text-secondary font-semibold hover:underline">Manage</button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/60/40 border border-border/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary text-[24px]">verified</span>
              <div>
                <p className="text-sm font-bold text-foreground">Tax Exemption #EU-88290-X</p>
                <p className="text-xs text-muted-foreground">
                  Reverse Charge VAT Applied · Status Valid
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-foreground text-xs font-semibold">
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
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Resource Meter
              </span>
              <span className="p-2 rounded-full bg-muted/60 text-foreground">
                <span className="material-symbols-outlined text-[18px]">group_work</span>
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
              <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
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
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Throughput
              </span>
              <span className="p-2 rounded-full bg-primary-container text-foreground">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
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
              <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full bg-primary-container rounded-full" style={{ width: "84%" }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-error font-medium pt-2 border-t border-border/20">
            Approaching 85% soft threshold.
          </p>
        </div>

        {/* Metric 3: Cloud Video Storage */}
        <div className="bg-card/85 backdrop-blur-2xl rounded-2xl border border-border/30 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Object Vault
              </span>
              <span className="p-2 rounded-full bg-tertiary-container text-on-tertiary-container">
                <span className="material-symbols-outlined text-[18px]">cloud</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">Cloud Video Storage</h3>
            <p className="text-xs text-muted-foreground mt-1">High-bitrate master library.</p>
            <div className="my-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-foreground">
                  2.4 TB <span className="text-base font-normal text-muted-foreground">/ 5 TB</span>
                </span>
                <span className="text-sm font-semibold text-tertiary">48% Used</span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full bg-tertiary rounded-full" style={{ width: "48%" }} />
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
      badgeClass: "bg-secondary-fixed text-secondary",
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
      badgeClass: "bg-on-surface text-surface-container-lowest",
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
      badgeClass: "bg-tertiary-container text-on-tertiary-container material-symbols-outlined",
      title: "Slack / Discord Dispatch Webhook",
      status: "ACTIVE",
      action: "Test Alert",
      desc: (
        <>
          Direct channel alerts configured to{" "}
          <code className="px-2 py-0.5 rounded bg-surface-container text-foreground font-mono text-xs">
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
        "bg-secondary-fixed text-on-secondary-fixed material-symbols-outlined",
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
          <button className="px-4 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed text-sm font-semibold hover:bg-secondary-fixed-dim transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">network_ping</span>
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
                className="w-full h-12 px-5 font-mono text-sm bg-muted/60/60 border border-border/40 rounded-full text-foreground select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSecretVisible((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={secretVisible ? "Hide secret" : "Show secret"}
              >
                <span className="material-symbols-outlined text-[20px]">
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
              className="h-12 px-6 rounded-full bg-card border border-border/60 hover:bg-surface-container-high/40 text-foreground text-sm font-bold transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
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
    <div className="p-5 rounded-2xl bg-muted/60/40 border border-border/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${badgeClass}`}
        >
          {badge}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-foreground text-[11px] font-bold">
              {status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
        <button className="px-4 py-2 rounded-full border border-border/40 bg-card text-foreground text-xs font-semibold hover:bg-surface-container-high/40 transition-colors">
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
      avatarClass: "bg-secondary-fixed text-on-secondary-fixed",
      name: "Amara Vance",
      isYou: true,
      email: "amara.v@frhm.agency",
      role: "Studio Director",
      roleLocked: true,
      roleClass: "bg-secondary-fixed text-on-secondary-fixed",
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
      avatarClass: "bg-tertiary-fixed text-on-tertiary-fixed",
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
      avatarClass: "bg-surface-container-highest text-foreground",
      name: "Derrick Holt",
      isYou: false,
      email: "d.holt@shellreps-corp.com",
      role: "Client Guest Reviewer",
      roleLocked: true,
      roleClass: "bg-surface-container-highest text-foreground",
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
          <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
            SOC-2 Type II Compliant
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/60/50 border border-border/30">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                Mandatory Google Workspace 2FA for all team members
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-container text-foreground">
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
          <button className="px-5 py-2.5 rounded-full bg-primary-container text-foreground text-sm font-bold hover:shadow-md transition-all flex items-center gap-2 self-start sm:self-auto">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            + Invite Collaborator
          </button>
        </div>

        {/* Quick Invite Input Bar */}
        <div className="p-4 rounded-2xl bg-muted/60/40 border border-border/25 mb-6 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground">
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
          <div className="relative w-full md:w-56">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full h-11 px-4 rounded-full bg-card border border-border/30 text-sm text-foreground focus:ring-2 focus:ring-secondary focus:outline-none cursor-pointer"
            >
              <option>Content Creator</option>
              <option>Campaign Lead</option>
              <option>Client Guest Reviewer</option>
              <option>Studio Director</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleInvite}
            className="w-full md:w-auto h-11 px-6 rounded-full bg-on-surface text-surface-container-lowest text-sm font-bold hover:bg-on-surface/90 transition-all shrink-0"
          >
            Send Invite
          </button>
        </div>

        {/* Team Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/30 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Member Name &amp; Email</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">2FA Status</th>
                <th className="py-3 px-4">Workspace Access</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {members.map((m) => (
                <tr key={m.email} className="hover:bg-muted/60/30 transition-colors">
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
                      <select
                        defaultValue={m.role}
                        className="h-8 px-3 rounded-full bg-muted/60 border border-border/30 text-xs font-medium text-foreground cursor-pointer"
                      >
                        <option>Campaign Lead</option>
                        <option>Content Creator</option>
                        <option>Client Guest Reviewer</option>
                      </select>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${m.twofaClass}`}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
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
                      <span className="text-muted-foreground/40 cursor-not-allowed text-xs font-semibold">
                        Protected
                      </span>
                    ) : (
                      <button
                        type="button"
                        title="Revoke Access"
                        className="text-muted-foreground hover:text-error transition-colors p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">
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
