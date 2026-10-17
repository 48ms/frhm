"use client"

import * as React from "react"
import Link from "next/link"
import { Icons } from '@/components/icons'

import {
  Infobar,
  InfobarContent,
  InfobarGroup,
  InfobarGroupContent,
  InfobarHeader,
  InfobarTrigger,
  useInfobar,
} from "@/components/ui/infobar"

const defaultData = {
  title: "Panduan Platform Frhm",
  sections: [
    {
      title: "Workspace Portofolio Klien",
      badge: "Multi-Tenant",
      icon: "building" as const,
      description:
        "Kelola seluruh brand klien secara terisolasi. Setiap workspace memiliki profil tone of voice, media library, dan akun sosial sendiri.",
      links: [{ title: "Buka Client Workspaces", url: "/admin/clients" }],
    },
    {
      title: "Kalender & Konten Terjadwal",
      badge: "Produksi",
      icon: "calendar" as const,
      description:
        "Susun draf konten multi-platform (Instagram, TikTok, LinkedIn, YouTube). Gunakan batch planning untuk menyusun agenda mingguan/bulanan.",
      links: [{ title: "Buka Kalender Konten", url: "/admin/calendar" }],
    },
    {
      title: "Brand Brain & AI Playbooks",
      badge: "AI Strategy",
      icon: "bot" as const,
      description:
        "Wawancara brand profile interaktif berbasis reasoning. Menjaga suara konten tetap konsisten dan bebas slop generik di semua channel.",
      links: [{ title: "Buka AI Studio", url: "/admin/ai" }],
    },
    {
      title: "Pintasan Keyboard",
      badge: "Shortcut",
      icon: "command" as const,
      description:
        "Tekan ⌘K / Ctrl+K untuk membuka Command Bar navigasi cepat. Tekan ⌘I / Ctrl+I untuk membuka atau menutup panel panduan ini kapan saja.",
    },
  ],
}

export function InfoSidebar({ ...props }: React.ComponentProps<typeof Infobar>) {
  const { content } = useInfobar()
  const data = content || defaultData

  return (
    <Infobar {...props}>
      <InfobarHeader className="bg-sidebar sticky top-0 z-10 flex flex-row items-center justify-between gap-2 border-b px-4 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Icons.help className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight truncate text-foreground">{data.title}</h2>
            <p className="text-3xs text-muted-foreground">Dokumentasi & Tips Kerja</p>
          </div>
        </div>
        <InfobarTrigger />
      </InfobarHeader>
      <InfobarContent>
        <InfobarGroup>
          <InfobarGroupContent>
            <div className="flex flex-col gap-3 px-3 py-3.5">
              {data.sections.map((section) => {
                const IconComponent = section.icon && section.icon in Icons ? Icons[section.icon] : null
                return (
                  <div
                    key={section.title}
                    className="p-3.5 rounded-2xl bg-card border border-border/50 shadow-2xs flex flex-col gap-2 transition-colors hover:border-border"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {IconComponent && (
                          <div className="size-6 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0">
                            <IconComponent className="size-3.5" />
                          </div>
                        )}
                        <h3 className="text-xs font-bold text-foreground truncate">{section.title}</h3>
                      </div>
                      {section.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-2xs text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>
                    {section.links && section.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/30">
                        {section.links.map((link) => (
                          <Link
                            key={link.title}
                            href={link.url}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-semibold text-primary bg-primary/5 hover:bg-primary/15 border border-primary/20 transition-colors"
                          >
                            <span>{link.title}</span>
                            <Icons.chevronRight className="size-2.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </InfobarGroupContent>
        </InfobarGroup>
      </InfobarContent>
    </Infobar>
  )
}
