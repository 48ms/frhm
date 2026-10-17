import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { InfobarProvider } from "@/components/ui/infobar"
import { InfoSidebar } from "./info-sidebar"
import { PageContainer } from "./page-container"

describe("InfoSidebar & InfobarTrigger (Contextual Help System)", () => {
  it("renders rich default platform documentation when no contextual content is provided", () => {
    render(
      <InfobarProvider defaultOpen={true}>
        <InfoSidebar />
      </InfobarProvider>
    )

    expect(screen.getByText("Panduan Platform Frhm")).toBeInTheDocument()
    expect(screen.getByText("Workspace Portofolio Klien")).toBeInTheDocument()
    expect(screen.getByText("Kalender & Konten Terjadwal")).toBeInTheDocument()
    expect(screen.getByText("Brand Brain & AI Playbooks")).toBeInTheDocument()
  })

  it("dynamically renders contextual documentation passed through PageContainer infoContent", () => {
    const customContent = {
      title: "Panduan Khusus Client Workspaces",
      sections: [
        {
          title: "Isolasi Multi-Tenant Klien",
          badge: "Security",
          icon: "building" as const,
          description: "Data tiap klien dipisah ketat dengan PostgreSQL RLS.",
          links: [{ title: "Lihat Dokumentasi", url: "/docs/tenant" }],
        },
      ],
    }

    render(
      <InfobarProvider defaultOpen={true}>
        <PageContainer
          pageTitle="Client Workspaces"
          pageDescription="Kelola klien"
          infoContent={customContent}
        >
          <div>Page Body</div>
        </PageContainer>
        <InfoSidebar />
      </InfobarProvider>
    )

    expect(screen.getByText("Panduan Khusus Client Workspaces")).toBeInTheDocument()
    expect(screen.getByText("Isolasi Multi-Tenant Klien")).toBeInTheDocument()
    expect(screen.getByText("Data tiap klien dipisah ketat dengan PostgreSQL RLS.")).toBeInTheDocument()
    expect(screen.getByText("Security")).toBeInTheDocument()
    expect(screen.getByText("Lihat Dokumentasi")).toBeInTheDocument()
  })
})
