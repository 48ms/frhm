"use client"

import * as React from "react"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { toast } from "sonner"

const FAQS = [
  {
    q: "How do I connect a new social channel to a client workspace?",
    a: "Open Social Accounts, select the active client from the top bar, then use Connect Channel to authorize Instagram, TikTok, or Facebook. The OAuth token is stored per client and auto-renews before expiry.",
  },
  {
    q: "Why is a scheduled post stuck in the approval gate?",
    a: "The Strict Client Approval Gate blocks publishing until the client signs off in their review portal. Check the Content Calendar for the pending badge and nudge the reviewer, or disable the gate in Settings → Workspace if your workflow allows it.",
  },
  {
    q: "How do I rotate a compromised webhook signing secret?",
    a: "Go to Settings → Integrations → Webhook Signing & Cryptographic Keys, then rotate the key from your middleware. Never expose the secret in client-side code; rotate immediately if it leaks.",
  },
  {
    q: "Can I invite a client as a read-only reviewer?",
    a: "Yes. In Settings → User Access, invite them with the Client Guest Reviewer role. They get approval-gate access only and cannot publish or edit campaign assets.",
  },
  {
    q: "What happens when I hit my API webhook quota?",
    a: "Dispatches queue for up to 24 hours at the 85% soft threshold and pause at 100%. Upgrade the quota from Settings → Billing, or batch low-priority triggers to stay under the limit.",
  },
]

const CHANNELS = [
  {
    icon: "mail",
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    title: "Email Support",
    desc: "support@frhm.agency",
    meta: "Send us the details",
    action: "Send Email",
    href: "mailto:support@frhm.agency",
  },
  {
    icon: "forum",
    iconClass: "bg-brand-accent/10 text-brand-accent",
    title: "Priority Live Chat",
    desc: "Enterprise tier",
    meta: "Coming soon",
    action: "Start Chat",
    soon: true,
  },
  {
    icon: "menu_book",
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    title: "Knowledge Base",
    desc: "Guides & API references",
    meta: "Coming soon",
    action: "Browse Docs",
    soon: true,
  },
]

export function SupportView() {
  const { client: activeClient } = useActiveDashboard()

  const [openFaq, setOpenFaq] = React.useState<number | null>(0)
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [priority, setPriority] = React.useState("Normal")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both the subject and the message.")
      return
    }
    toast.success("Support request submitted", {
      description: `Ticket queued for ${activeClient?.name ?? "your workspace"} · Priority: ${priority}`,
    })
    setSubject("")
    setMessage("")
    setPriority("Normal")
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Help &amp; Support Center
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Support Center</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-3xl">
            Get help with workspace configuration, publishing pipelines, and API integrations for{" "}
            <span className="font-semibold text-foreground">
              {activeClient?.name ?? "your workspace"}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Quick Help Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CHANNELS.map((c) => (
          <div
            key={c.title}
            className="admin-card bg-card/90 backdrop-blur-2xl p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <span
                className={`inline-flex w-12 h-12 rounded-2xl items-center justify-center mb-4 ${c.iconClass}`}
              >
                <span className="material-symbols-outlined text-[24px]">{c.icon}</span>
              </span>
              <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.meta}</span>
              {c.href ? (
                <a
                  href={c.href}
                  className="text-xs font-semibold text-brand-accent hover:underline"
                >
                  {c.action}
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  className="text-xs font-semibold text-foreground/70 cursor-not-allowed"
                >
                  {c.action}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FAQ */}
        <div className="lg:col-span-3 admin-card bg-card/90 backdrop-blur-2xl p-8 shadow-sm">
          <div className="border-b border-border/60 pb-5 mb-6">
            <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Quick answers to the most common workspace and publishing questions.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={f.q}
                  className="rounded-2xl bg-muted/40 border border-border/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left"
                  >
                    <span className="text-sm font-semibold text-foreground">{f.q}</span>
                    <span
                      className={`material-symbols-outlined text-[20px] text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 admin-card bg-card/90 backdrop-blur-2xl p-8 shadow-sm">
          <div className="border-b border-border/60 pb-5 mb-6">
            <h2 className="text-xl font-bold text-foreground">Submit a Request</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Our support team typically responds within 2 business hours.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block" htmlFor="sup-subject">
                Subject
              </label>
              <input
                id="sup-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full h-12 px-5 rounded-full bg-muted/60 border border-border/40 text-sm text-foreground focus:bg-background focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block" htmlFor="sup-priority">
                Priority
              </label>
              <select
                id="sup-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-12 px-5 rounded-full bg-muted/60 border border-border/40 text-sm text-foreground focus:ring-2 focus:ring-brand-accent focus:outline-none cursor-pointer"
              >
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block" htmlFor="sup-message">
                Message
              </label>
              <textarea
                id="sup-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Describe what happened, which client workspace is affected, and any steps to reproduce."
                className="w-full px-5 py-3 rounded-2xl bg-muted/60 border border-border/40 text-sm text-foreground focus:bg-background focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-brand-accent text-brand-accent-foreground text-sm font-bold hover:shadow-lg hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Submit Request
            </button>
          </form>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="admin-card bg-card/90 backdrop-blur-2xl p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Recent Tickets</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track the status of requests raised by your agency team.
            </p>
          </div>
        </div>

        <div className="py-12 text-center space-y-2">
          <span className="material-symbols-outlined text-[32px] text-foreground/40">inbox</span>
          <p className="text-sm font-semibold text-foreground">No tickets yet</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Ticket tracking is not connected to a backend yet. Requests submitted through the form above are
            handled by the support team by email for now.
          </p>
        </div>
      </div>
    </div>
  )
}
