'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQueryState, parseAsStringEnum } from 'nuqs'
import { safeRedirect } from '@/lib/safe-redirect'
import { z } from 'zod'
import { useAppForm } from '@/lib/form'
import type { AnyFieldApi } from '@tanstack/react-form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs'
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle'
import { PRODUCT_NAME } from '@/lib/config'
import { Icons } from '@/components/icons'
import './auth-stage.css'

const loginSchema = z.object({
  email: z.email('Masukkan email yang valid, contoh: nama@email.com'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
})

const signupSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter.'),
  email: z.email('Masukkan email yang valid, contoh: nama@email.com'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
})

function isFieldInvalid(field: AnyFieldApi) {
  return field.state.meta.isTouched && !field.state.meta.isValid
}

function PasswordInput({ field, autoComplete }: { field: AnyFieldApi; autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  const invalid = isFieldInvalid(field)
  return (
    <div className='relative'>
      <Input
        id={field.name}
        name={field.name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={field.state.value ?? ''}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder='Password'
        aria-invalid={invalid}
        aria-describedby={invalid ? `${field.name}-error` : undefined}
        className='h-12 rounded-full border-border bg-white/95 pr-12 pl-6 font-normal text-foreground transition duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-brand-accent/40 dark:bg-white/5'
      />
      <button
        type='button'
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className='absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:outline-none'
      >
        {visible ? <Icons.eyeOff className='size-[20px]' /> : <Icons.eye className='size-[20px]' />}
      </button>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg className='size-4' viewBox='0 0 24 24' aria-hidden='true'>
      <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
      <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
      <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
      <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z' />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg className='size-4 fill-current' viewBox='0 0 24 24' aria-hidden='true'>
      <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
    </svg>
  )
}

function LinkedInMark() {
  return (
    <svg className='size-4 fill-current' viewBox='0 0 24 24' aria-hidden='true'>
      <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' />
    </svg>
  )
}

function Notice({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive'
          : 'mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400'
      }
    >
      {children}
    </div>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirect = safeRedirect(searchParams.get('redirect'), '/admin/dashboard')
  const supabase = createClient()

  // Tab lives in the URL (?mode=signup) per Rule #4, deep-linkable + survives refresh.
  const [mode, setMode] = useQueryState(
    'mode',
    parseAsStringEnum(['login', 'signup']).withDefault('login')
  )

  const [authError, setAuthError] = useState<string | null>(null)
  const [signupNotice, setSignupNotice] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  // Remember me persists the last email locally (never the password) so the
  // next visit pre-fills the username field.
  const [remember, setRemember] = useState(true)

  // Hydrate the saved email once on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('frhm:remember-email')
      if (stored) {
        loginForm.setFieldValue('email', stored)
      }
    } catch {
      // localStorage unavailable (private mode), non-fatal, skip silently.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loginForm = useAppForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setAuthError(null)
      setSignupNotice(null)
      const { error } = await supabase.auth.signInWithPassword({
        email: value.email,
        password: value.password,
      })
      if (error) {
        setAuthError(
          error.message === 'Invalid login credentials'
            ? 'Email atau password salah. Periksa kembali lalu coba lagi.'
            : `Gagal masuk: ${error.message}`
        )
        return
      }
      // Persist the email for the next visit when "Remember me" is checked.
      try {
        if (remember) {
          window.localStorage.setItem('frhm:remember-email', value.email)
        } else {
          window.localStorage.removeItem('frhm:remember-email')
        }
      } catch {
        // Storage full or blocked, non-fatal, continue to the redirect.
      }
      router.push(redirect)
      router.refresh()
    },
  })

  const signupForm = useAppForm({
    defaultValues: { full_name: '', email: '', password: '' },
    validators: { onSubmit: signupSchema },
    onSubmit: async ({ value }) => {
      setAuthError(null)
      setSignupNotice(null)
      const { error } = await supabase.auth.signUp({
        email: value.email,
        password: value.password,
        options: {
          data: { full_name: value.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      })
      if (error) {
        setAuthError(`Gagal mendaftar: ${error.message}`)
        return
      }
      setSignupNotice(
        'Akun dibuat. Buka tautan konfirmasi yang dikirim ke email Anda untuk mengaktifkan akun, lalu masuk kembali di sini.'
      )
    },
  })

  const handleOAuth = async (provider: 'google' | 'facebook' | 'linkedin_oidc') => {
    setAuthError(null)
    setSignupNotice(null)
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })
    if (error) {
      const label = provider === 'google' ? 'Google' : provider === 'facebook' ? 'Facebook' : 'LinkedIn'
      setAuthError(`Gagal masuk dengan ${label}: ${error.message}`)
      setGoogleLoading(false)
    }
  }

  return (
    <div className='auth-viewport relative overflow-x-hidden px-3 py-3 sm:px-6 sm:py-6 lg:px-10 lg:py-10'>
      {/* Ambient background diffuse glow orbs (decorative). */}
      <div
        aria-hidden='true'
        className='pointer-events-none fixed top-0 left-0 size-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-lum-tertiary-fixed-dim/50 blur-[110px]'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none fixed right-0 bottom-0 size-[500px] translate-x-1/4 translate-y-1/4 rounded-full bg-lum-primary/40 blur-[130px]'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none fixed top-1/4 right-1/4 size-[380px] rounded-full bg-lum-secondary-fixed-dim/40 blur-[120px]'
      />

      {/* Master centre architectural glass container. */}
      <main className='auth-container relative z-10 flex w-full max-w-[1140px] flex-col overflow-hidden rounded-[3rem]'>
        {/* Integrated shared navigation bar. */}
        <header className='auth-nav flex w-full items-center justify-between rounded-t-[3rem] px-8 py-6'>
          <div className='flex items-center gap-3'>
            <Link
              href='/'
              className='flex items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:outline-none'
            >
              <div className='relative size-8'>
                <Image
                  src='/logo-frhm.png'
                  alt={PRODUCT_NAME}
                  fill
                  className='object-contain'
                  priority
                />
              </div>
              <span className='font-syne text-2xl font-extrabold tracking-tight text-foreground'>
                {PRODUCT_NAME}
              </span>
              <span className='size-2 rounded-full bg-brand-accent' aria-hidden='true' />
            </Link>
          </div>

          <nav className='hidden items-center gap-8 md:flex' aria-label='Primary'>
            <Link
              href='/'
              className='font-syne text-[11px] font-bold tracking-[0.12em] text-foreground uppercase transition-colors duration-200 hover:text-brand-accent active:scale-95'
            >
              HOME
            </Link>
            <span className='font-syne text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase'>
              EXPLORE
            </span>
            <span className='font-syne text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase'>
              ABOUT
            </span>
          </nav>

          <div className='flex items-center gap-3'>
            <ThemeModeToggle />
          </div>
        </header>

        {/* Split-screen body canvas. */}
        <div className='grid min-h-[640px] grid-cols-1 lg:grid-cols-12'>
          {/* Left column: authentication well. */}
          <section
            className='relative flex flex-col justify-between bg-white/30 p-6 sm:p-10 lg:col-span-5 lg:p-12 dark:bg-white/[0.02]'
            aria-labelledby='auth-heading'
          >
            <div>
              <h1
                id='auth-heading'
                className='font-syne text-2xl font-extrabold tracking-wider text-foreground uppercase'
              >
                WELCOME TO THE SPACE
              </h1>
            </div>

            {/* Recessed glass form card. */}
            <div className='auth-card my-6 rounded-[2rem] p-6 sm:p-7'>
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setAuthError(null)
                  setSignupNotice(null)
                  void setMode(v as 'login' | 'signup')
                }}
                className='w-full'
              >
                <TabsList className='[&_[data-slot=motion-highlight]]:!bg-transparent [&_[data-slot=motion-highlight]]:shadow-none grid h-10 w-full grid-cols-2 rounded-full bg-white/60 p-1 ring-1 ring-white/60 backdrop-blur-sm dark:bg-white/5 dark:ring-white/10'>
                  <TabsTrigger
                    value='login'
                    className='[&_[data-slot=motion-highlight]]:!bg-transparent rounded-full font-syne text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground transition-colors data-[state=active]:bg-lum-primary data-[state=active]:text-lum-ink data-[state=active]:!shadow-[0_6px_16px_-4px_rgba(212,255,50,0.7)]'
                  >
                    LOG IN
                  </TabsTrigger>
                  <TabsTrigger
                    value='signup'
                    className='[&_[data-slot=motion-highlight]]:!bg-transparent rounded-full font-syne text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground transition-colors data-[state=active]:bg-lum-primary data-[state=active]:text-lum-ink data-[state=active]:!shadow-[0_6px_16px_-4px_rgba(212,255,50,0.7)]'
                  >
                    SIGN UP
                  </TabsTrigger>
                </TabsList>

                {/* Log in */}
                <TabsContent value='login'>
                  <p className='mt-6 mb-6 text-center font-syne text-xl font-bold text-foreground'>
                    LOG IN TO YOUR ACCOUNT
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void loginForm.handleSubmit()
                    }}
                    className='space-y-4'
                    noValidate
                  >
                    <loginForm.Field name='email'>
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className='sr-only'>
                            E-mail
                          </FieldLabel>
                          <div className='relative'>
                            <Input
                              id={field.name}
                              name={field.name}
                              type='email'
                              inputMode='email'
                              autoComplete='email'
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                              placeholder='E-mail'
                              aria-invalid={isFieldInvalid(field)}
                              aria-describedby={isFieldInvalid(field) ? `${field.name}-error` : undefined}
                              className='h-12 rounded-full border-border bg-white/95 pr-12 pl-6 font-normal text-foreground transition duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-brand-accent/40 dark:bg-white/5'
                            />
                            <Icons.mail
                              className='pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground'
                              aria-hidden='true'
                            />
                          </div>
                          {isFieldInvalid(field) && (
                            <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )}
                    </loginForm.Field>

                    <loginForm.Field name='password'>
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className='sr-only'>
                            Password
                          </FieldLabel>
                          <PasswordInput field={field} autoComplete='current-password' />
                          {isFieldInvalid(field) && (
                            <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )}
                    </loginForm.Field>

                    <div className='flex items-center justify-between px-1 pt-1 text-xs'>
                      <label className='flex cursor-pointer items-center gap-2 select-none'>
                        <Checkbox
                          checked={remember}
                          onCheckedChange={(v) => setRemember(v === true)}
                          name='remember'
                          className='size-4 rounded-md border-border data-[state=checked]:bg-brand-accent'
                        />
                        <span className='text-xs text-muted-foreground'>Remember me</span>
                      </label>
                      <Link
                        href='/auth/forgot-password'
                        className='rounded text-xs font-semibold text-brand-accent underline-offset-2 transition-all hover:underline focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:outline-none'
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className='pt-2'>
                      <loginForm.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                          <LoadingButton
                            type='submit'
                            loading={isSubmitting}
                            loadingLabel='Sedang masuk'
                            className='h-12 w-full rounded-full bg-lum-primary font-syne text-[11px] font-bold tracking-[0.12em] text-lum-ink uppercase !shadow-[0_10px_24px_-4px_rgba(212,255,50,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lum-primary active:scale-[0.98]'
                          >
                            LOG IN
                          </LoadingButton>
                        )}
                      </loginForm.Subscribe>
                    </div>
                  </form>
                </TabsContent>

                {/* Sign up */}
                <TabsContent value='signup'>
                  <p className='mt-6 mb-6 text-center font-syne text-xl font-bold text-foreground'>
                    CREATE YOUR ACCOUNT
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void signupForm.handleSubmit()
                    }}
                    className='space-y-4'
                    noValidate
                  >
                    <signupForm.Field name='full_name'>
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className='sr-only'>
                            Full name
                          </FieldLabel>
                          <div className='relative'>
                            <Input
                              id={field.name}
                              name={field.name}
                              autoComplete='name'
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                              placeholder='Full name'
                              aria-invalid={isFieldInvalid(field)}
                              aria-describedby={isFieldInvalid(field) ? `${field.name}-error` : undefined}
                              className='h-12 rounded-full border-border bg-white/95 pr-12 pl-6 font-normal text-foreground transition duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-brand-accent/40 dark:bg-white/5'
                            />
                            <Icons.user
                              className='pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground'
                              aria-hidden='true'
                            />
                          </div>
                          {isFieldInvalid(field) && (
                            <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )}
                    </signupForm.Field>

                    <signupForm.Field name='email'>
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className='sr-only'>
                            E-mail
                          </FieldLabel>
                          <div className='relative'>
                            <Input
                              id={field.name}
                              name={field.name}
                              type='email'
                              inputMode='email'
                              autoComplete='email'
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                              placeholder='E-mail'
                              aria-invalid={isFieldInvalid(field)}
                              aria-describedby={isFieldInvalid(field) ? `${field.name}-error` : undefined}
                              className='h-12 rounded-full border-border bg-white/95 pr-12 pl-6 font-normal text-foreground transition duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-brand-accent/40 dark:bg-white/5'
                            />
                            <Icons.mail
                              className='pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground'
                              aria-hidden='true'
                            />
                          </div>
                          {isFieldInvalid(field) && (
                            <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )}
                    </signupForm.Field>

                    <signupForm.Field name='password'>
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className='sr-only'>
                            Password
                          </FieldLabel>
                          <PasswordInput field={field} autoComplete='new-password' />
                          {isFieldInvalid(field) && (
                            <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )}
                    </signupForm.Field>

                    <div className='pt-2'>
                      <signupForm.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                          <LoadingButton
                            type='submit'
                            loading={isSubmitting}
                            loadingLabel='Sedang membuat akun'
                            className='h-12 w-full rounded-full bg-lum-primary font-syne text-[11px] font-bold tracking-[0.12em] text-lum-ink uppercase !shadow-[0_10px_24px_-4px_rgba(212,255,50,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-lum-primary active:scale-[0.98]'
                          >
                            SIGN UP
                          </LoadingButton>
                        )}
                      </signupForm.Subscribe>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>

              {authError && <Notice tone='error'>{authError}</Notice>}
              {signupNotice && <Notice tone='success'>{signupNotice}</Notice>}

              {/* Social fast-connect. */}
              <div className='mt-6 text-center'>
                <span className='mb-3 block font-syne text-[11px] tracking-[0.1em] text-muted-foreground uppercase'>
                  or you can log in with
                </span>
                <div className='flex items-center justify-center gap-3'>
                  <button
                    type='button'
                    onClick={() => void handleOAuth('google')}
                    disabled={googleLoading}
                    aria-label='Login with Google'
                    className='flex size-9 items-center justify-center rounded-full border border-border bg-white shadow-sm transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:outline-none disabled:opacity-50 disabled:hover:scale-100 dark:bg-white/5'
                  >
                    <GoogleMark />
                  </button>
                  <button
                    type='button'
                    onClick={() => void handleOAuth('facebook')}
                    disabled={googleLoading}
                    aria-label='Login with Facebook'
                    className='flex size-9 items-center justify-center rounded-full bg-lum-secondary text-white shadow-sm transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:outline-none disabled:opacity-50 disabled:hover:scale-100'
                  >
                    <FacebookMark />
                  </button>
                  <button
                    type='button'
                    onClick={() => void handleOAuth('linkedin_oidc')}
                    disabled={googleLoading}
                    aria-label='Login with LinkedIn'
                    className='flex size-9 items-center justify-center rounded-full bg-[#0077B5] text-white shadow-sm transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:outline-none disabled:opacity-50 disabled:hover:scale-100'
                  >
                    <LinkedInMark />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer / workspace link. */}
            <div className='pt-2 text-center'>
              {mode === 'login' ? (
                <p className='text-xs text-muted-foreground'>
                  Don&apos;t have account yet?{' '}
                  <button
                    type='button'
                    onClick={() => {
                      setAuthError(null)
                      setSignupNotice(null)
                      void setMode('signup')
                    }}
                    className='ml-1 rounded font-bold text-lum-tertiary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:outline-none'
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className='text-xs text-muted-foreground'>
                  Already have an account?{' '}
                  <button
                    type='button'
                    onClick={() => {
                      setAuthError(null)
                      setSignupNotice(null)
                      void setMode('login')
                    }}
                    className='ml-1 rounded font-bold text-lum-tertiary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:outline-none'
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>
          </section>

          {/* Right column: agency showcase & graphic canvas. */}
          <aside
            className='group relative hidden flex-col justify-between overflow-hidden border-white/50 bg-white/10 p-8 lg:col-span-7 lg:flex lg:border-l lg:p-12 dark:bg-white/[0.02]'
            aria-hidden='true'
          >
            {/* Abstract overlapping pill & fluted-glass composition. */}
            <div className='relative my-auto flex w-full items-center justify-center py-12 transition-transform duration-700 ease-out group-hover:scale-[1.02]'>
              {/* Layer 1: electric blue pill, top-right. */}
              <div
                className='absolute -top-6 right-6 z-0 h-36 w-72 -rotate-3 rounded-full bg-lum-secondary opacity-95 shadow-lg'
                style={{ animation: 'float-drift 9s ease-in-out infinite' }}
              />

              {/* Layer 2: neon lime anchor pill, centre. */}
              <div
                className='relative z-30 flex h-36 w-80 rotate-1 items-center justify-center rounded-full bg-lum-primary shadow-xl'
                style={{ transform: 'translateY(-56px) rotate(1deg)', animation: '7s ease-in-out 0.2s infinite normal none running float-slow' }}
              >
                <h2
                  className='inline-block font-syne text-[44px] font-extrabold tracking-tighter text-lum-on-surface select-none md:text-[54px]'
                  style={{ animation: 'float-slow 6s ease-in-out infinite' }}
                >
                  DIGITAL
                </h2>
              </div>

              {/* Layer 3: fluted glass panel, top-right overlay. */}
              <div
                className='fluted-glass-pane absolute -top-4 right-10 z-20 h-40 w-44 overflow-hidden rounded-2xl border border-white/60 shadow-md'
                style={{ animation: 'float-reverse 8s ease-in-out infinite' }}
              >
                <div className='h-full w-full bg-gradient-to-b from-transparent via-white/10 to-lum-primary/20' />
              </div>

              {/* Layer 4: lilac pill, bottom-left. */}
              <div
                className='absolute -bottom-8 left-4 z-10 h-36 w-80 rotate-2 rounded-full bg-lum-tertiary-fixed-dim/90 shadow-xl'
                style={{ animation: 'float-reverse 8.5s ease-in-out infinite 0.4s' }}
              />

              {/* Layer 5: fluted glass panel, bottom-left overlay. */}
              <div
                className='fluted-glass-pane absolute bottom-4 left-14 z-20 h-36 w-52 rounded-2xl border border-white/70 shadow-lg'
                style={{ animation: 'float-drift 10s ease-in-out infinite 0.6s' }}
              >
                <div className='h-full w-full bg-gradient-to-t from-transparent via-lum-tertiary-container/30 to-white/20' />
              </div>

              {/* Layer 6: lower monolith typography. */}
              <div className='absolute -bottom-14 right-14 z-30 select-none'>
                <h2
                  className='inline-block font-syne text-[48px] font-extrabold tracking-tighter text-lum-on-surface md:text-[60px]'
                  style={{ animation: 'float-reverse 7s ease-in-out infinite 0.5s' }}
                >
                  SPACE
                </h2>
              </div>

              {/* Decorative starburst accents. */}
              <div
                className='absolute top-2 right-36 z-30 font-syne text-3xl text-lum-primary select-none'
                style={{ animation: 'star-spin 10s linear infinite' }}
              >
                ✻
              </div>
              <div
                className='absolute top-1/3 left-6 z-20 font-syne text-2xl text-lum-tertiary select-none'
                style={{ animation: 'star-spin 14s linear infinite reverse' }}
              >
                ✻
              </div>
              <div
                className='absolute right-4 bottom-16 z-30 font-syne text-2xl text-lum-secondary select-none'
                style={{ animation: 'star-spin 11s linear infinite 1s' }}
              >
                ✻
              </div>
            </div>
          </aside>
        </div>

        <footer className='w-full border-t border-white/40 bg-white/30 py-3 text-center dark:bg-white/[0.02]'>
          <p className='font-syne text-[11px] tracking-[0.1em] text-muted-foreground uppercase select-none'>
            &copy; {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-svh items-center justify-center'>
          <div className='flex items-center gap-3 text-sm text-muted-foreground'>
            <Icons.spinner className='size-4 animate-spin' aria-hidden='true' />
            Menyiapkan halaman masuk...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
