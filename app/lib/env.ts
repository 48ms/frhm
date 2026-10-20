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
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().optional(),
})

const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AYRSHARE_API_KEY: z.string().optional(),
  AYRSHARE_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_BOT_SECRET_TOKEN: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional(),
  TELEGRAM_LINK_SECRET: z.string().optional(),
  ADMIN_TELEGRAM_CHAT_ID: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_URL: z.string().optional(),
  BRIDGE_API_KEY: z.string().optional(),
  OAUTH_STATE_SECRET: z.string().optional(),
  REVIEW_LINK_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_PRESET: z.string().optional(),
  AI_DEFAULT_MODEL: z.string().optional(),
  AI_DEFAULT_BASE_URL: z.string().optional(),
  AI_DEFAULT_API_KEY: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_REDIRECT_URI: z.string().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

function getClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  })

  if (!result.success) {
    // Di lingkungan test atau build, berikan fallback safe jika variabel belum diset
    if (process.env.NODE_ENV === "test") {
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "test-key",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo",
        NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "FrhmBot",
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
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AYRSHARE_API_KEY: process.env.AYRSHARE_API_KEY,
    AYRSHARE_WEBHOOK_SECRET: process.env.AYRSHARE_WEBHOOK_SECRET,
    TELEGRAM_BOT_SECRET_TOKEN: process.env.TELEGRAM_BOT_SECRET_TOKEN,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID,
    TELEGRAM_LINK_SECRET: process.env.TELEGRAM_LINK_SECRET,
    ADMIN_TELEGRAM_CHAT_ID: process.env.ADMIN_TELEGRAM_CHAT_ID,
    CRON_SECRET: process.env.CRON_SECRET,
    WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    WHATSAPP_WEBHOOK_URL: process.env.WHATSAPP_WEBHOOK_URL,
    BRIDGE_API_KEY: process.env.BRIDGE_API_KEY,
    OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET,
    REVIEW_LINK_SECRET: process.env.REVIEW_LINK_SECRET,
    CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
    AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL,
    AI_DEFAULT_BASE_URL: process.env.AI_DEFAULT_BASE_URL,
    AI_DEFAULT_API_KEY: process.env.AI_DEFAULT_API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_REDIRECT_URI: process.env.META_REDIRECT_URI,
  })

  if (!result.success) {
    if (process.env.NODE_ENV === "test") {
      return {
        ...getClientEnv(),
        NODE_ENV: "test",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-key",
        AYRSHARE_API_KEY: process.env.AYRSHARE_API_KEY,
        TELEGRAM_BOT_SECRET_TOKEN: process.env.TELEGRAM_BOT_SECRET_TOKEN,
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID,
        TELEGRAM_LINK_SECRET: process.env.TELEGRAM_LINK_SECRET,
        ADMIN_TELEGRAM_CHAT_ID: process.env.ADMIN_TELEGRAM_CHAT_ID,
        CRON_SECRET: process.env.CRON_SECRET,
        WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        WHATSAPP_WEBHOOK_URL: process.env.WHATSAPP_WEBHOOK_URL,
        BRIDGE_API_KEY: process.env.BRIDGE_API_KEY,
        OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET,
        REVIEW_LINK_SECRET: process.env.REVIEW_LINK_SECRET,
        CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
        AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL,
        AI_DEFAULT_BASE_URL: process.env.AI_DEFAULT_BASE_URL,
        AI_DEFAULT_API_KEY: process.env.AI_DEFAULT_API_KEY,
        LOG_LEVEL: process.env.LOG_LEVEL,
        META_APP_ID: process.env.META_APP_ID,
        META_APP_SECRET: process.env.META_APP_SECRET,
        META_REDIRECT_URI: process.env.META_REDIRECT_URI,
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
