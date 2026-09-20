import Link from "next/link"
import { PRODUCT_NAME } from "@/lib/config"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          {PRODUCT_NAME}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-[600px] mx-auto">
          Platform manajemen deliverable digital marketing & social media specialist.
        </p>

        <div className="flex gap-4 items-center justify-center flex-col sm:flex-row">
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Masuk ke Dashboard
          </Link>
        </div>
      </main>

      <footer className="py-6 border-t border-border/40 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {PRODUCT_NAME}.</p>
      </footer>
    </div>
  )
}
