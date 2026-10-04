"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type LogEntry = {
  id: number
  platform: "TikTok" | "Instagram"
  handle: string
  asset: string
  format: string
  timestamp: string
  status: "success" | "error"
  statusLabel: string
  actionLabel: string
}

const LOGS: LogEntry[] = [
  {
    id: 1,
    platform: "TikTok",
    handle: "@b2bshell",
    asset: "Q3 Architecture Launch Video (4K 60fps)",
    format: "TikTok short • 42s",
    timestamp: "Today, 14:28:12",
    status: "success",
    statusLabel: "Success (200)",
    actionLabel: "View details",
  },
  {
    id: 2,
    platform: "Instagram",
    handle: "@shell.creative",
    asset: "Design System 2.0 Carousel Breakdown",
    format: "Instagram carousel • 10 slides",
    timestamp: "Today, 11:15:04",
    status: "success",
    statusLabel: "Success (200)",
    actionLabel: "View details",
  },
  {
    id: 3,
    platform: "Instagram",
    handle: "@shell.careers.id",
    asset: "Engineering Lead Hiring Reel",
    format: "Instagram reel • 15s",
    timestamp: "Yesterday, 18:40:22",
    status: "error",
    statusLabel: "Access token expired",
    actionLabel: "Reconnect",
  },
]

const DELIVERY_DETAIL: Record<
  number,
  { title: string; outcome: string; requestId: string; explanation: string; nextStep: string | null }
> = {
  1: {
    title: "Webhook delivered",
    outcome: "200 OK",
    requestId: "req_8f2a4c91",
    explanation: "Payload received by Instagram and acknowledged within the retry window.",
    nextStep: null,
  },
  2: {
    title: "Webhook delivered",
    outcome: "200 OK",
    requestId: "req_1d77be03",
    explanation: "Payload received by Instagram and acknowledged within the retry window.",
    nextStep: null,
  },
  3: {
    title: "Delivery failed",
    outcome: "401 Unauthorized",
    requestId: "req_4b09e622",
    explanation: "The access token for this account expired before the scheduled post went out.",
    nextStep: "Reconnect the account to refresh the token and resend the post from the queue.",
  },
}

export function WebhookLogs() {
  const [activeLog, setActiveLog] = React.useState<LogEntry | null>(null)

  const handleInspect = (log: LogEntry) => {
    setActiveLog(log)
  }

  const handleCopyRequestId = async (requestId: string) => {
    await navigator.clipboard.writeText(requestId)
    toast.success("Request id copied to the clipboard")
  }

  const detail = activeLog ? DELIVERY_DETAIL[activeLog.id] : null

  return (
    <>
      <section className="bg-card/85 backdrop-blur-2xl rounded-3xl border border-border p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Recent posts and webhook activity
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every cross-posted Reel and TikTok, with the webhook response
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.info("No active filters")}
              className="px-3.5 py-1.5 rounded-full bg-background border border-border text-foreground text-[11px] font-bold hover:bg-accent transition-all cursor-pointer"
            >
              Clear filters
            </button>
            <button
              onClick={() => toast.info("Export started. The CSV will download shortly.")}
              className="px-3.5 py-1.5 rounded-full bg-muted text-foreground text-[11px] font-bold hover:bg-secondary transition-all cursor-pointer"
            >
              Export logs
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="py-3 px-4 text-[11px] text-muted-foreground uppercase font-bold">Account</th>
                <th className="py-3 px-4 text-[11px] text-muted-foreground uppercase font-bold">Post &amp; format</th>
                <th className="py-3 px-4 text-[11px] text-muted-foreground uppercase font-bold">Time</th>
                <th className="py-3 px-4 text-[11px] text-muted-foreground uppercase font-bold">Status</th>
                <th className="py-3 px-4 text-[11px] text-muted-foreground uppercase font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-[12px] shrink-0",
                        log.platform === "TikTok"
                          ? "bg-foreground text-background"
                          : "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white"
                      )}>
                        {log.platform === "TikTok"
                          ? <Icons.music_note className="size-3.5" />
                          : <Icons.photo_camera className="size-3.5" />}
                      </span>
                      <span className="font-bold text-foreground">{log.handle}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{log.asset}</span>
                      <span className="text-xs text-muted-foreground">{log.format}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap",
                      log.status === "success"
                        ? "bg-primary/15 text-primary"
                        : "bg-rose-500/15 text-rose-600"
                    )}>
                      {log.status === "success"
                        ? <Icons.check className="size-3" />
                        : <Icons.warning className="size-3" />}
                      {log.statusLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleInspect(log)}
                      className={cn(
                        "font-bold hover:underline cursor-pointer whitespace-nowrap",
                        log.status === "success" ? "text-foreground" : "text-rose-600"
                      )}
                    >
                      {log.actionLabel}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={activeLog !== null} onOpenChange={(o) => { if (!o) setActiveLog(null) }}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          {activeLog && detail && (
            <>
              <DialogHeader className="p-6 border-b flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-xl",
                    activeLog.status === "success" ? "bg-primary text-primary-foreground" : "bg-rose-500/15 text-rose-600"
                  )}>
                    {activeLog.status === "success"
                      ? <Icons.check className="size-5" />
                      : <Icons.warning className="size-5" />}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold">{detail.title}</DialogTitle>
                    <DialogDescription className="text-xs">
                      {activeLog.asset} on {activeLog.handle}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Platform response</p>
                    <p className="font-mono font-bold text-foreground mt-1">{detail.outcome}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Attempted at</p>
                    <p className="font-mono text-foreground mt-1">{activeLog.timestamp}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">What happened</p>
                  <p className="text-foreground mt-1 leading-relaxed">{detail.explanation}</p>
                </div>

                {detail.nextStep && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                    <p className="text-[10px] uppercase font-bold text-amber-700">Next step</p>
                    <p className="text-foreground mt-1 leading-relaxed">{detail.nextStep}</p>
                  </div>
                )}

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Request id</p>
                    <button
                      onClick={() => handleCopyRequestId(detail.requestId)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Icons.copy className="size-3.5" />
                      Copy request id
                    </button>
                  </div>
                  <p className="font-mono text-xs text-foreground mt-1 break-all">{detail.requestId}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Payload sent</p>
                  <div className="rounded-xl border border-border bg-foreground/[0.03] overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                      <Icons.code className="size-3.5 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">POST /webhooks/delivery</span>
                    </div>
                    <pre className="p-3 font-mono text-[11px] leading-relaxed text-foreground overflow-x-auto">
{JSON.stringify(
  {
    id: activeLog.id,
    platform: activeLog.platform,
    handle: activeLog.handle,
    asset: activeLog.asset,
    format: activeLog.format,
    attempt: 1,
  },
  null,
  2,
)}
                    </pre>
                  </div>
                </div>
              </div>

              <DialogFooter className="justify-end p-4 border-t">
                {activeLog.status === "error" ? (
                  <Button onClick={() => { setActiveLog(null); toast.info(`Reconnect started for ${activeLog.handle}`) }} size="sm">
                    <Icons.refresh className="size-4" />
                    Reconnect account
                  </Button>
                ) : null}
                <Button onClick={() => setActiveLog(null)} size="sm" variant="outline">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
