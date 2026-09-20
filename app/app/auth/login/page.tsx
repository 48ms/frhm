"use client"

import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RippleButton } from "@/components/motion/ripple-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { PRODUCT_NAME } from "@/lib/config"
import { MailIcon, LockIcon, UserIcon } from "lucide-react"

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirect = searchParams.get("redirect") || "/admin/dashboard"
  const [loading, setLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [suEmail, setSuEmail] = useState("")
  const [suPassword, setSuPassword] = useState("")
  const [suName, setSuName] = useState("")

  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push(redirect)
    router.refresh()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupLoading(true)
    setError(null)
    setMessage(null)
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPassword,
      options: {
        data: { full_name: suName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })
    if (error) {
      setError(error.message)
      setSignupLoading(false)
      return
    }
    setMessage("Akun dibuat. Cek email untuk konfirmasi, atau langsung login jika konfirmasi dimatikan.")
    setSignupLoading(false)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-8 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            F
          </div>
          <span className="font-bold text-xl tracking-tight">{PRODUCT_NAME}</span>
        </div>
        <div className="space-y-4 max-w-md">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-snug text-foreground">
              &ldquo;Ruang kerja terpadu untuk menyusun strategi, menjadwalkan konten, dan mengulas feedback brand klien.&rdquo;
            </p>
            <footer className="text-sm text-muted-foreground">Bima Maulana Saputra, Founder & Lead</footer>
          </blockquote>
        </div>
        <div className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                F
              </div>
              <span className="font-bold text-lg">{PRODUCT_NAME}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Selamat Datang</h1>
            <p className="text-sm text-muted-foreground">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-9 bg-muted rounded-lg p-1">
              <TabsTrigger value="login" className="rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Masuk
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Daftar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 rounded-lg border-input bg-background pl-10 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10 rounded-lg border-input bg-background pl-10 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <RippleButton type="submit" disabled={loading} className="w-full h-10 rounded-lg text-sm font-medium">
                  {loading ? "Memproses..." : "Masuk"}
                </RippleButton>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name" className="text-xs font-medium text-muted-foreground">Nama Lengkap</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="su-name"
                      type="text"
                      placeholder="Nama Anda"
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      required
                      className="h-10 rounded-lg border-input bg-background pl-10 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email" className="text-xs font-medium text-muted-foreground">Email</Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="su-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      required
                      className="h-10 rounded-lg border-input bg-background pl-10 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-password" className="text-xs font-medium text-muted-foreground">Password</Label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="su-password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-10 rounded-lg border-input bg-background pl-10 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <RippleButton type="submit" disabled={signupLoading} className="w-full h-10 rounded-lg text-sm font-medium">
                  {signupLoading ? "Membuat akun..." : "Daftar Akun"}
                </RippleButton>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              {message}
            </div>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">Atau lanjutkan dengan</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setError("Google OAuth belum dikonfigurasi. Gunakan email & password.")}
            disabled={loading}
            className="w-full h-10 rounded-lg text-sm font-medium border-input hover:bg-muted"
          >
            <svg className="mr-2 h-4 w-4 shrink-0" width={16} height={16} style={{ width: 16, height: 16 }} viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Dengan melanjutkan, Anda menyetujui ketentuan layanan & kebijakan privasi {PRODUCT_NAME}.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}