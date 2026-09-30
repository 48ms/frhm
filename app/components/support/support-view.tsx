"use client"

import * as React from "react"
import { useQueryState, parseAsString } from "nuqs"
import { SOCIAL_CLIENTS } from "@/components/social-accounts/social-data"
import { toast } from "sonner"

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-secondary-fixed text-on-secondary-fixed",
  "In Progress": "bg-tertiary-fixed text-on-tertiary-fixed",
  Resolved: "bg-primary-container text-on-surface",
  Closed: "bg-surface-container-highest text-on-surface-variant",
}

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

const TICKETS = [
  {
    id: "SUP-4821",
    subject: "Instagram Reels publish failing for B2B Shell Reps",
    status: "In Progress",
    priority: "High",
    updated: "2 hours ago",
  },
  {
    id: "SUP-4805",
    subject: "Request: add LinkedIn channel integration",
    status: "Open",
    priority: "Normal",
    updated: "Yesterday",
  },
  {
    id: "SUP-4788",
    subject: "TikTok token re-authentication loop",
    status: "Resolved",
    priority: "High",
    updated: "3 days ago",
  },
  {
    id: "SUP-4750",
    subject: "Export analytics report as CSV",
    status: "Closed",
    priority: "Low",
    updated: "Last week",
  },
]

const CHANNELS = [
  {
    icon: "mail",
    iconClass: "bg-secondary-fixed text-on-secondary-fixed",
    title: "Email Support",
    desc: "support@frhm.agency",
    meta: "Replies within 2 business hours",
    action: "Send Email",
  },
  {
    icon: "forum",
    iconClass: "bg-primary-container text-on-surface",
    title: "Priority Live Chat",
    desc: "24/7 for Enterprise tier",
    meta: "Avg. wait under 3 minutes",
    action: "Start Chat",
  },
  {
    icon: "menu_book",
    iconClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    title: "Knowledge Base",
    desc: "Guides & API references",
    meta: "120+ articles and playbooks",
    action: "Browse Docs",
  },
]

export function SupportView() {
  const [clientId] = useQueryState("clientId", parseAsString.withDefault(SOCIAL_CLIENTS[0].id))
  const activeClient = React.useMemo(
    () => SOCIAL_CLIENTS.find((c) => c.id === clientId) ?? SOCIAL_CLIENTS[0],
    [clientId]
  )

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            Help &amp; Support Center
          </div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Support Center</h1>
          <p className="text-sm text-on-surface-variant mt-1.5 max-w-3xl">
            Get help with workspace configuration, publishing pipelines, and API integrations for{" "}
            <span className="font-semibold text-on-surface">
              {activeClient?.name ?? "B2B Shell Reps"}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto text-xs text-on-surface-variant bg-surface-container-lowest/80 backdrop-blur-md px-3 py-2 rounded-full border border-outline-variant/30">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>All systems operational</span>
        </div>
      </div>

      {/* Quick Help Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CHANNELS.map((c) => (
          <div
            key={c.title}
            className="bg-surface-container-lowest/85 backdrop-blur-2xl rounded-2xl border border-outline-variant/30 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <span
                className={`inline-flex w-12 h-12 rounded-2xl items-center justify-center mb-4 ${c.iconClass}`}
              >
                <span className="material-symbols-outlined text-[24px]">{c.icon}</span>
              </span>
              <h3 className="text-lg font-bold text-on-surface">{c.title}</h3>
              <p className="text-sm text-on-surface-variant mt-1">{c.desc}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">{c.meta}</span>
              <button
                type="button"
                onClick={() => toast.info(`${c.title} — ${c.action} coming soon in this prototype.`)}
                className="text-xs font-semibold text-secondary hover:underline"
              >
                {c.action}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FAQ */}
        <div className="lg:col-span-3 bg-surface-container-lowest/85 backdrop-blur-2xl rounded-2xl border border-outline-variant/30 p-8 shadow-sm">
          <div className="border-b border-outline-variant/20 pb-5 mb-6">
            <h2 className="text-xl font-bold text-on-surface">Frequently Asked Questions</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Quick answers to the most common workspace and publishing questions.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={f.q}
                  className="rounded-2xl bg-surface-container-low/40 border border-outline-variant/25 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left"
                  >
                    <span className="text-sm font-semibold text-on-surface">{f.q}</span>
                    <span
                      className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-on-surface-variant leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-surface-container-lowest/85 backdrop-blur-2xl rounded-2xl border border-outline-variant/30 p-8 shadow-sm">
          <div className="border-b border-outline-variant/20 pb-5 mb-6">
            <h2 className="text-xl font-bold text-on-surface">Submit a Request</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Our support team typically responds within 2 business hours.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface block" htmlFor="sup-subject">
                Subject
              </label>
              <input
                id="sup-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full h-12 px-5 rounded-full bg-surface-container-low/60 border border-outline-variant/40 text-sm text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface block" htmlFor="sup-priority">
                Priority
              </label>
              <select
                id="sup-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-12 px-5 rounded-full bg-surface-container-low/60 border border-outline-variant/40 text-sm text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none cursor-pointer"
              >
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface block" htmlFor="sup-message">
                Message
              </label>
              <textarea
                id="sup-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Describe what happened, which client workspace is affected, and any steps to reproduce."
                className="w-full px-5 py-3 rounded-2xl bg-surface-container-low/60 border border-outline-variant/40 text-sm text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary focus:outline-none transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-primary-container text-on-surface text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Submit Request
            </button>
          </form>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-surface-container-lowest/85 backdrop-blur-2xl rounded-2xl border border-outline-variant/30 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Your Recent Tickets</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Track the status of requests raised by your agency team.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.info("Ticket history export queued.")}
            className="px-5 py-2.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-sm font-semibold hover:bg-surface-container-high/40 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {TICKETS.map((t) => (
                <tr key={t.id} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-xs text-on-surface-variant">{t.id}</td>
                  <td className="py-4 px-4 font-semibold text-on-surface">{t.subject}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-xs font-semibold ${
                        t.priority === "High"
                          ? "text-error"
                          : t.priority === "Low"
                            ? "text-on-surface-variant"
                            : "text-on-surface"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${STATUS_STYLES[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-xs text-on-surface-variant">
                    {t.updated}
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
