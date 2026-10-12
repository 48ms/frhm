"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { supportTicketQueries, useCreateSupportTicket } from "@/features/support/api/queries"
import type { SupportTicket, SupportTicketPriority, SupportTicketStatus } from "@/features/support/api/types"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/animate-ui/components/radix/accordion"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"

/**
 * Status badges ride the logo palette (DESIGN.md §2). Open stays primary-
 * accent because it signals "waiting for action"; in-progress becomes the
 * warning yellow; resolved is the success green. Closed returns to neutral
 * because the ticket is out of the active loop.
 */
const STATUS_META: Record<SupportTicketStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-brand-accent/10 text-brand-accent" },
  in_progress: { label: "In Progress", cls: "bg-warning/10 text-warning dark:text-warning" },
  resolved: { label: "Resolved", cls: "bg-success/10 text-success dark:text-success" },
  closed: { label: "Closed", cls: "bg-muted text-muted-foreground" },
}

/**
 * Priority uses semantic tokens — red for critical, amber for high — so a
 * color-blind user can still distinguish Urgent from Normal by hue alone,
 * and the hierarchy reads without relying on saturation.
 */
const PRIORITY_CLS: Record<SupportTicketPriority, string> = {
  Low: "text-muted-foreground",
  Normal: "text-foreground",
  High: "text-brand-yellow",
  Urgent: "text-brand-red",
}

const ticketListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const ticketItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 350,
      damping: 25,
    },
  },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
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

const CHANNELS = [
  {
    Icon: Icons.mail,
    iconClass: "bg-brand-blue/10 text-brand-blue dark:text-brand-blue",
    title: "Email Support",
    desc: "support@frhm.agency",
    meta: "Send us the details",
    action: "Send Email",
    href: "mailto:support@frhm.agency",
  },
  {
    Icon: Icons.chat,
    iconClass: "bg-brand-accent/10 text-brand-accent",
    title: "Priority Live Chat",
    desc: "Enterprise tier",
    meta: "Coming soon",
    action: "Start Chat",
    soon: true,
  },
  {
    Icon: Icons.bookOpen,
    iconClass: "bg-muted/40 text-muted-foreground",
    title: "Knowledge Base",
    desc: "Guides & API references",
    meta: "Coming soon",
    action: "Browse Docs",
    soon: true,
  },
]

export function SupportView() {
  const { client: activeClient } = useActiveDashboard()
  const queryClient = useQueryClient()

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    ...supportTicketQueries.listByClient(activeClient?.id ?? ""),
    enabled: Boolean(activeClient?.id),
  })

  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [priority, setPriority] = React.useState<SupportTicketPriority>("Normal")

  const { mutateAsync: createTicket, isPending: isSubmitting } = useCreateSupportTicket()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error("Isi subjek dan pesan dukungan.")
      return
    }
    
    try {
      await createTicket({
        clientId: activeClient?.id ?? "",
        subject: subject.trim(),
        message: message.trim(),
        priority,
      })
      
      toast.success("Tiket dukungan dikirim", {
        description: `Tiket antre untuk ${activeClient?.name ?? "workspace Anda"} · Prioritas: ${priority}`,
      })
      setSubject("")
      setMessage("")
      setPriority("Normal")
    } catch (err) {
      toast.error("Gagal mengirim permintaan.")
    }
  }

  return (
    <PageContainer
      pageTitle="Support Center"
      pageDescription={`Get help with workspace configuration, publishing pipelines, and API integrations for ${activeClient?.name ?? "your workspace"}.`}
      className="pb-20 space-y-8"
    >

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
                <c.Icon className="size-6" />
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
          <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`faq-${i}`}
                className="rounded-2xl bg-muted/40 border border-border/40 overflow-hidden px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4 text-sm font-semibold text-foreground">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
              <Tabs value={priority} onValueChange={(val) => setPriority(val as SupportTicketPriority)}>
                <TabsList
                  className="w-full grid grid-cols-4 h-11 p-1 bg-muted/60 border border-border/40 rounded-xl"
                  highlightClassName="bg-card shadow-sm rounded-lg"
                >
                  <TabsTrigger value="Low" className="text-xs font-bold rounded-lg py-1.5">Low</TabsTrigger>
                  <TabsTrigger value="Normal" className="text-xs font-bold rounded-lg py-1.5">Normal</TabsTrigger>
                  <TabsTrigger value="High" className="text-xs font-bold rounded-lg py-1.5">High</TabsTrigger>
                  <TabsTrigger value="Urgent" className="text-xs font-bold rounded-lg py-1.5 text-destructive font-extrabold">Urgent</TabsTrigger>
                </TabsList>
              </Tabs>
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

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full h-12 rounded-full bg-brand-accent text-brand-accent-foreground text-sm font-bold hover:shadow-lg hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2"
            >
              <Icons.send className="size-4" />
              Submit Request
            </Button>
          </form>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="admin-card bg-card/90 backdrop-blur-2xl p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>Your Recent Tickets</span>
              {tickets.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted border border-border/40 font-mono font-semibold">
                  <MetricTicker value={tickets.length} />
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track the status of requests raised by your agency team.
            </p>
          </div>
        </div>

        {ticketsLoading ? (
          <div className="space-y-3" data-testid="tickets-loading">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl border border-border/40 p-5 space-y-2">
                <div className="h-3 w-40 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-64 rounded-full bg-muted/70 animate-pulse" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center space-y-2" data-testid="tickets-empty">
            <Icons.inbox className="size-8 mx-auto text-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Belum ada tiket</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Kirim permintaan lewat formulir di atas. Setiap tiket yang dikirim akan tercatat di sini
              beserta statusnya.
            </p>
          </div>
        ) : (
          <motion.div
            variants={ticketListVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
            data-testid="tickets-list"
          >
            {tickets.map((t: SupportTicket) => {
              const status = STATUS_META[t.status] ?? STATUS_META.open
              return (
                <motion.div
                  key={t.id}
                  variants={ticketItemVariants}
                  className="rounded-2xl border border-border/40 bg-muted/20 p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-1xs font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                    <span className={`text-1xs font-semibold ${PRIORITY_CLS[t.priority] ?? PRIORITY_CLS.Normal}`}>
                      {t.priority}
                    </span>
                    <span className="text-1xs text-muted-foreground ml-auto">{formatDate(t.created_at)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{t.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{t.message}</p>
                  {t.admin_reply && (
                    <div className="mt-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20 p-3">
                      <p className="text-1xs font-semibold text-brand-accent mb-1">Balasan Tim Support</p>
                      <p className="text-xs text-foreground whitespace-pre-line">{t.admin_reply}</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}
