"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface AuditLogsModalProps {
  open: boolean
  onClose: () => void
}

export function AuditLogsModal({ open, onClose }: AuditLogsModalProps) {
  const dummyLogs = [
    { id: "log-1", timestamp: "2026-10-02 14:22:10", action: "OAUTH_TOKEN_REFRESH", status: "SUCCESS", ip: "192.168.1.45" },
    { id: "log-2", timestamp: "2026-10-02 12:05:01", action: "SCOPE_VERIFICATION", status: "SUCCESS", ip: "10.0.0.12" },
    { id: "log-3", timestamp: "2026-10-01 18:40:55", action: "WEBHOOK_PAYLOAD_DELIVERY", status: "VERIFIED", ip: "172.16.0.8" },
    { id: "log-4", timestamp: "2026-10-01 09:15:22", action: "TOKEN_EXPIRY_CHECK", status: "WARNING", ip: "192.168.1.45" },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="p-6 border-b flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
              <Icons.monitoring className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Access audit log</DialogTitle>
              <DialogDescription className="text-xs">
                Sign-ins and token refreshes for this workspace.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-muted-foreground uppercase border-b">
              <tr>
                <th className="pb-3 font-bold">Time</th>
                <th className="pb-3 font-bold">Event</th>
                <th className="pb-3 font-bold">Result</th>
                <th className="pb-3 font-bold">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {dummyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 text-muted-foreground">{log.timestamp}</td>
                  <td className="py-3 font-bold">{log.action}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === "SUCCESS" || log.status === "VERIFIED" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="justify-end p-4">
          <Button onClick={onClose} size="sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
