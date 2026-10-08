export const runtime = 'nodejs';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from 'react'
import { KBar } from "@/components/kbar";
import { PRODUCT_NAME } from "@/lib/config";

// Login-stage typefaces, self-hosted (no build-time network fetch).
const syne = localFont({
  src: './fonts/SyneVF.woff2',
  variable: '--font-syne-src',
  weight: '400 800',
  display: 'swap',
});

const hanken = localFont({
  src: './fonts/HankenGroteskVF.woff2',
  variable: '--font-hanken-src',
  weight: '100 900',
  display: 'swap',
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: "Client dashboard for social media deliverables",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", syne.variable, hanken.variable)} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <NuqsAdapter>
              <TooltipProvider>
                {/* Suspense wajib: KBar membaca `useQueryState` (nuqs) yang
                    memakai `useSearchParams` — tanpa boundary ini, prerender
                    halaman statis (404) memicu error "useSearchParams() should
                    be wrapped in a suspense boundary". */}
                <Suspense>
                  <KBar>{children}</KBar>
                </Suspense>
              </TooltipProvider>
            </NuqsAdapter>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
