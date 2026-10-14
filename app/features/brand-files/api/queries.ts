import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getClientFiles,
  getClientFile,
  upsertClientFile,
  verifyClientFile,
  deleteClientFile,
} from "./service"
import type {
  ClientFile,
  UpdateClientFileInput,
  VerifyClientFileInput,
  DeleteClientFileInput,
} from "./types"

export const brandFilesKeys = {
  all: ["brand-files"] as const,
  lists: () => [...brandFilesKeys.all, "list"] as const,
  list: (clientId: string) => [...brandFilesKeys.lists(), clientId] as const,
  details: () => [...brandFilesKeys.all, "detail"] as const,
  detail: (clientId: string, path: string) =>
    [...brandFilesKeys.details(), clientId, path] as const,
}

/**
 * Fetch all markdown files in client_files for a specific client.
 */
export function useClientFiles(clientId: string) {
  return useQuery({
    queryKey: brandFilesKeys.list(clientId),
    queryFn: () => getClientFiles(clientId),
    enabled: Boolean(clientId),
  })
}

/**
 * Fetch a single markdown file for a specific client.
 */
export function useClientFile(clientId: string, path: string) {
  return useQuery({
    queryKey: brandFilesKeys.detail(clientId, path),
    queryFn: () => getClientFile(clientId, path),
    enabled: Boolean(clientId && path),
  })
}

/**
 * Mutation to create or update a markdown file in client_files with optimistic cache update.
 */
export function useUpsertClientFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateClientFileInput) => upsertClientFile(input),
    onMutate: async (newFile) => {
      await queryClient.cancelQueries({
        queryKey: brandFilesKeys.list(newFile.clientId),
      })
      const previousFiles = queryClient.getQueryData<ClientFile[]>(
        brandFilesKeys.list(newFile.clientId)
      )

      if (previousFiles) {
        const hasVerify = newFile.content.includes("(verify-quarterly)")
        const updatedList = previousFiles.some((f) => f.path === newFile.path)
          ? previousFiles.map((f) =>
              f.path === newFile.path
                ? {
                    ...f,
                    content: newFile.content,
                    updated_at: new Date().toISOString(),
                    needs_verification: hasVerify,
                  }
                : f
            )
          : [
              ...previousFiles,
              {
                client_id: newFile.clientId,
                path: newFile.path,
                content: newFile.content,
                updated_at: new Date().toISOString(),
                needs_verification: hasVerify,
                verified_at: null,
              },
            ]

        queryClient.setQueryData(brandFilesKeys.list(newFile.clientId), updatedList)
      }

      return { previousFiles }
    },
    onError: (_err, newFile, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(
          brandFilesKeys.list(newFile.clientId),
          context.previousFiles
        )
      }
    },
    onSettled: (_data, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: brandFilesKeys.list(vars.clientId),
      })
      void queryClient.invalidateQueries({
        queryKey: brandFilesKeys.detail(vars.clientId, vars.path),
      })
      // Invalidate client queries if brand-profile.md was updated
      if (vars.path === "brand-profile.md") {
        void queryClient.invalidateQueries({ queryKey: ["social", "clients"] })
      }
    },
  })
}

/**
 * Mutation to mark a file as verified for the quarter.
 */
export function useVerifyClientFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: VerifyClientFileInput) => verifyClientFile(input),
    onSettled: (_data, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: brandFilesKeys.list(vars.clientId),
      })
      void queryClient.invalidateQueries({
        queryKey: brandFilesKeys.detail(vars.clientId, vars.path),
      })
    },
  })
}

/**
 * Mutation to delete a custom client file.
 */
export function useDeleteClientFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DeleteClientFileInput) => deleteClientFile(input),
    onSettled: (_data, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: brandFilesKeys.list(vars.clientId),
      })
    },
  })
}
