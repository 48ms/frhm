/**
 * WoopSocial MCP Tool Definitions & Execution Engine
 * Sesuai arsitektur MCP Frhm & kedaulatan platform:
 * - 100% server-side execution dengan isolasi multi-tenant (clientId wajib).
 * - Mengakses API key hanya via bridge_config (server-side RLS / secure credential).
 * - Logging audit otomatis untuk setiap pemanggilan mutasi.
 */

import { getBridgeKey } from "@/lib/bridge/config"
import {
  health,
  listSocialAccounts,
  validatePost,
  createPost,
  listPosts,
  toBridgePlatform,
  type BridgePlatform,
} from "@/lib/bridge/woopsocial"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"

export interface McpToolDefinition {
  name: string
  description: string
  parameters: {
    type: "object"
    properties: Record<string, { type: string; description: string; enum?: string[] }>
    required: string[]
  }
}

export const WOOPSOCIAL_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "woopsocial_health",
    description: "Periksa status koneksi dan otentikasi live bridge WoopSocial MCP.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "woopsocial_list_social_accounts",
    description: "Dapatkan daftar seluruh akun media sosial yang terhubung untuk klien aktif.",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "ID klien unik untuk isolasi tenant" },
      },
      required: ["clientId"],
    },
  },
  {
    name: "woopsocial_validate_post",
    description: "Validasi format draf postingan (panjang teks, batas karakter, media) sebelum rilis.",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "ID klien unik" },
        platform: {
          type: "string",
          description: "Platform target",
          enum: ["INSTAGRAM", "TIKTOK", "LINKEDIN", "X", "FACEBOOK", "YOUTUBE"],
        },
        content: { type: "string", description: "Teks caption postingan" },
        mediaUrl: { type: "string", description: "URL media yang akan diunggah (opsional)" },
      },
      required: ["clientId", "platform", "content"],
    },
  },
  {
    name: "woopsocial_schedule_post",
    description: "Jadwalkan atau publikasikan konten ke antrean WoopSocial klien.",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "ID klien unik" },
        platform: { type: "string", description: "Platform target" },
        content: { type: "string", description: "Teks caption konten" },
        scheduledAt: { type: "string", description: "ISO 8601 timestamp waktu tayang" },
        mediaUrl: { type: "string", description: "URL media gambar/video (opsional)" },
      },
      required: ["clientId", "platform", "content", "scheduledAt"],
    },
  },
  {
    name: "woopsocial_list_posts",
    description: "Ambil riwayat publikasi konten dan link tautan langsung postingan yang sudah tayang.",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "ID klien unik" },
      },
      required: ["clientId"],
    },
  },
]

export interface McpExecutionResult {
  success: boolean
  data?: unknown
  error?: string
  toolName: string
}

/**
 * Mengambil project ID atau ayrshare profile key per client untuk isolasi tenant
 */
async function getClientProjectId(clientId: string): Promise<string | null> {
  if (!clientId) return null
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from("clients")
    .select("id, ayrshare_profile_key, name")
    .eq("id", clientId)
    .single()
  return (data?.ayrshare_profile_key as string | null) ?? data?.id ?? null
}

/**
 * Eksekutor terpusat untuk pemanggilan tool WoopSocial MCP
 */
export async function executeWoopSocialTool(
  toolName: string,
  params: Record<string, any>
): Promise<McpExecutionResult> {
  const apiKey = await getBridgeKey()

  if (!apiKey) {
    logger.warn("mcp.woopsocial.no_api_key", { toolName })
    return {
      success: false,
      error: "Bridge API Key belum dikonfigurasi di bridge_config. Hubungi administrator.",
      toolName,
    }
  }

  const clientId = params.clientId as string | undefined

  try {
    switch (toolName) {
      case "woopsocial_health": {
        const res = await health(apiKey)
        return {
          success: res.ok,
          data: res.ok ? { status: "connected", details: res.data } : undefined,
          error: !res.ok ? res.error : undefined,
          toolName,
        }
      }

      case "woopsocial_list_social_accounts": {
        if (!clientId) {
          return { success: false, error: "clientId wajib diisi", toolName }
        }
        const projectId = await getClientProjectId(clientId)
        const res = await listSocialAccounts(apiKey, projectId ?? undefined)

        return {
          success: res.ok,
          data: res.ok ? res.data : undefined,
          error: !res.ok ? res.error : undefined,
          toolName,
        }
      }

      case "woopsocial_validate_post": {
        if (!clientId || !params.platform || !params.content) {
          return { success: false, error: "clientId, platform, dan content wajib diisi", toolName }
        }
        const platform = toBridgePlatform(params.platform)
        if (!platform) {
          return { success: false, error: `Platform ${params.platform} tidak didukung`, toolName }
        }

        const body = {
          content: [
            {
              text: params.content,
              media: params.mediaUrl ? [{ url: params.mediaUrl }] : [],
            },
          ],
          socialAccounts: [{ platform }],
        }

        const res = await validatePost(apiKey, body)
        return {
          success: res.ok,
          data: res.ok ? res.data : undefined,
          error: !res.ok ? res.error : undefined,
          toolName,
        }
      }

      case "woopsocial_schedule_post": {
        if (!clientId || !params.platform || !params.content || !params.scheduledAt) {
          return { success: false, error: "Parameter schedule tidak lengkap", toolName }
        }
        const platform = toBridgePlatform(params.platform)
        if (!platform) {
          return { success: false, error: `Platform ${params.platform} tidak didukung`, toolName }
        }

        const body = {
          content: [
            {
              text: params.content,
              media: params.mediaUrl ? [{ url: params.mediaUrl }] : [],
            },
          ],
          schedule: {
            type: "SCHEDULE_FOR_LATER",
            scheduledFor: params.scheduledAt,
          },
          socialAccounts: [{ platform }],
        }

        const res = await createPost(apiKey, body)

        if (res.ok) {
          void logAudit({
            action: "mcp.woopsocial.schedule_post",
            entityType: "scheduled_post",
            clientId,
            summary: `Dijadwalkan via WoopSocial MCP untuk ${platform} pada ${params.scheduledAt}`,
          })
        }

        return {
          success: res.ok,
          data: res.ok ? res.data : undefined,
          error: !res.ok ? res.error : undefined,
          toolName,
        }
      }

      case "woopsocial_list_posts": {
        if (!clientId) {
          return { success: false, error: "clientId wajib diisi", toolName }
        }
        const projectId = await getClientProjectId(clientId)
        const res = await listPosts(apiKey, projectId ?? undefined)

        return {
          success: res.ok,
          data: res.ok ? res.data : undefined,
          error: !res.ok ? res.error : undefined,
          toolName,
        }
      }

      default:
        return {
          success: false,
          error: `Tool "${toolName}" tidak dikenali pada WoopSocial MCP`,
          toolName,
        }
    }
  } catch (err: unknown) {
    logger.error("mcp.woopsocial.execution_error", { toolName, error: err instanceof Error ? err.message : String(err) })
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan internal pada eksekusi MCP",
      toolName,
    }
  }
}
