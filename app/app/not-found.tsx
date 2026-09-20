"use client"

import Link from "next/link"
import { HomeIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <HomeIcon className="size-8" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="mt-2 text-lg text-muted-foreground">Halaman tidak ditemukan</p>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Maaf, halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <HomeIcon className="mr-2 size-4" />
            Kembali ke Beranda
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="h-11 rounded-xl gap-2"
          >
            <RotateCcwIcon className="size-4" />
            Kembali
          </Button>
        </div>
      </div>
    </div>
  )
}