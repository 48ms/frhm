"use client"

import { useEffect } from "react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageContainer } from "@/components/layout/page-container"

export default function AiStudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("AI Studio Error Boundary caught an error:", error)
  }, [error])

  return (
    <PageContainer
      pageTitle="AI Creative Studio & Strategy Hub"
      pageDescription="Terjadi kendala saat memuat ruang kerja AI"
    >
      <Card className="border-destructive/30 bg-destructive/5 mt-4">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <Icons.alertCircle className="size-6 text-destructive" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Gagal Memuat AI Studio</h2>
          <p className="text-xs text-muted-foreground max-w-md mt-1 mb-5">
            {error.message || "Terjadi kesalahan internal pada layanan AI Studio. Coba muat ulang."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="gap-2 text-xs cursor-pointer"
          >
            <Icons.refresh className="size-3.5" />
            Muat Ulang Halaman
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
