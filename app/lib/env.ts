import { z } from "zod"

/**
 * AGENTS.md Rule 15: Manajemen Environment & Rahasia (Security-First)
 * Skema Zod terpusat untuk validasi variabel lingkungan.
 * Memisahkan secara ketat token publik (`NEXT_PUBLIC_*`) dari secret keys backend.
 */

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL yang valid"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY wajib diisi"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AYRSHARE_API_KEY: z.string().optional(),
  TELEGRAM_BOT_SECRET_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_URL: z.string().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

function getClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })

  if (!result.success) {
    // Di lingkungan test atau build, berikan fallback safe jika variabel belum diset
    if (process.env.NODE_ENV === "test") {
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "test-key",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      }
    }
    console.error("❌ Invalid client environment variables:", result.error.format())
    throw new Error("Konfigurasi variabel lingkungan publik (client) tidak valid.")
  }

  return result.data
}

function isBrowserEnvironment(): boolean {
  if (process.env.NODE_ENV === "test" && !(globalThis as Record<string, unknown>).__SIMULATE_BROWSER__) {
    return false
  }
  return typeof window !== "undefined"
}

function getServerEnv(): ServerEnv {
  if (isBrowserEnvironment()) {
    throw new Error("DILARANG mengakses getServerEnv() di sisi browser (client). Rahasia backend terancam bocor!")
  }

  const result = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AYRSHARE_API_KEY: process.env.AYRSHARE_API_KEY,
    TELEGRAM_BOT_SECRET_TOKEN: process.env.TELEGRAM_BOT_SECRET_TOKEN,
    TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID,
    CRON_SECRET: process.env.CRON_SECRET,
    WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    WHATSAPP_WEBHOOK_URL: process.env.WHATSAPP_WEBHOOK_URL,
  })

  if (!result.success) {
    if (process.env.NODE_ENV === "test") {
      return {
        ...getClientEnv(),
        NODE_ENV: "test",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-key",
        AYRSHARE_API_KEY: process.env.AYRSHARE_API_KEY,
        TELEGRAM_BOT_SECRET_TOKEN: process.env.TELEGRAM_BOT_SECRET_TOKEN,
        TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID,
        CRON_SECRET: process.env.CRON_SECRET,
        WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        WHATSAPP_WEBHOOK_URL: process.env.WHATSAPP_WEBHOOK_URL,
      }
    }
    console.error("❌ Invalid server environment variables:", result.error.format())
    throw new Error("Konfigurasi variabel lingkungan rahasia (server) tidak valid.")
  }

  return result.data
}

export const env = {
  get client() {
    return getClientEnv()
  },
  get server() {
    return getServerEnv()
  },
}
