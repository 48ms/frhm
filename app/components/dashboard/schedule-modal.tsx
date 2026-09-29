'use client'

import { useState } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ScheduleModal({ trigger }: { trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[480px] rounded-2xl border border-lum-outline-variant/30 bg-lum-surface-lowest shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-lum-on-surface">Schedule New Post</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-xs font-bold text-lum-outline">Connected Channel</Label>
            <Select defaultValue="ig">
              <SelectTrigger className="rounded-xl border-lum-outline-variant/40 bg-lum-surface-low text-xs">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ig">Instagram Reels & Stories (@frhm.studio)</SelectItem>
                <SelectItem value="tt">TikTok Creative Showcase (@frhmapp)</SelectItem>
                <SelectItem value="yt">YouTube Shorts (FRHM Agency TV)</SelectItem>
                <SelectItem value="li">LinkedIn Pulse (FRHM Digital Group)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-bold text-lum-outline">Post Title & Hook</Label>
            <Input 
              className="rounded-xl border-lum-outline-variant/40 bg-lum-surface-low text-xs" 
              placeholder="e.g. Spatial Audio & Holographic UI Breakdown" 
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-bold text-lum-outline">Dispatch Timestamp</Label>
            <Input 
              type="datetime-local" 
              className="rounded-xl border-lum-outline-variant/40 bg-lum-surface-low text-xs" 
            />
          </div>
        </div>

        <DialogFooter className="border-t border-lum-outline-variant/30 pt-4">
          <Button 
            variant="outline" 
            className="rounded-full border-lum-outline-variant/40 text-xs text-lum-on-surface hover:bg-lum-surface-container"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            className="rounded-full bg-lum-cobalt text-xs font-bold text-white hover:bg-lum-cobalt-light"
            onClick={() => {
              setOpen(false)
              toast.success("Post berhasil dijadwalkan & masuk antrean!")
            }}
          >
            <Icons.send className="mr-1.5 size-3.5" />
            Confirm Dispatch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
