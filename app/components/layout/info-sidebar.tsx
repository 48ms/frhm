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
  title: "Bantuan Workspace",
  sections: [
    {
      title: "Client Workspace",
      description:
        "Enam grup tab: Setup, Radar, Produksi, Marketing, Insight, Output. Reset password dan cabut session ada di menu ⋯.",
    },
    {
      title: "Deliverables",
      description:
        "Filter status dan tipe di atas tabel. Cari judul, urutkan kolom Diupdate, ganti jumlah baris per halaman.",
    },
    {
      title: "Pintasan",
      description: "Ctrl+I atau Cmd+I membuka panel ini. Skip link: Tab sekali dari atas halaman.",
      links: [{ title: "Dashboard admin", url: "/admin/dashboard" }],
    },
  ],
}

export function InfoSidebar({ ...props }: React.ComponentProps<typeof Infobar>) {
  const { content } = useInfobar()
  const data = content || defaultData

  return (
    <Infobar {...props}>
      <InfobarHeader className="bg-sidebar sticky top-0 z-10 flex flex-row items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="min-w-0 flex-1 text-lg font-semibold">{data.title}</h2>
        <InfobarTrigger />
      </InfobarHeader>
      <InfobarContent>
        <InfobarGroup>
          <InfobarGroupContent>
            <div className="flex flex-col gap-6 px-4 py-4">
              {data.sections.map((section) => (
                <div key={section.title} className="flex flex-col gap-3">
                  <h3 className="text-foreground text-sm font-semibold">{section.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {section.description}
                  </p>
                  {section.links && section.links.length > 0 && (
                    <ul className="flex flex-col gap-1.5">
                      {section.links.map((link) => (
                        <li key={link.title}>
                          <Link
                            href={link.url}
                            className="text-primary flex items-center gap-1.5 text-sm underline"
                          >
                            <span>{link.title}</span>
                            <Icons.chevronRight className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </InfobarGroupContent>
        </InfobarGroup>
      </InfobarContent>
    </Infobar>
  )
}
