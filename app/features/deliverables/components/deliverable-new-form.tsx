"use client"

import { useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient, useSuspenseQuery, useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { useAppForm } from "@/lib/form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { toast } from "sonner"
import { createDeliverableMutation } from "../api/mutations"
import { clientsListQueryOptions } from "@/features/clients/api/queries"

const createSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  client_id: z.string().min(1, "Pilih klien terlebih dahulu"),
  type: z.enum(["content", "brief", "report"] as const),
  content: z.string().optional(),
})

type CreateSchema = z.infer<typeof createSchema>

export function DeliverableNewForm() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch data client list as options (page 1, perPage 100)
  const { data: clientsResponse } = useSuspenseQuery(
    clientsListQueryOptions({ page: 1, perPage: 100 })
  )
  
  const clientOptions = useMemo(
    () => clientsResponse.data.map((c) => ({ value: c.id, label: c.name })) ?? [],
    [clientsResponse.data]
  )

  const mutation = useMutation(createDeliverableMutation)

  // Admin deep-linking from a client workspace (?client=<id>) shouldn't have to re-pick it.
  const searchParams = useSearchParams()
  const preselectedClient = searchParams.get('client') ?? ''

  const form = useAppForm({
    defaultValues: {
      title: "",
      client_id: preselectedClient,
      type: "content",
      content: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync(value as {
          title: string
          client_id: string
          type: "content" | "brief" | "report"
          content?: string
        })
        toast.success("Deliverable berhasil dibuat")
        router.push("/admin/deliverables")
      } catch {
        toast.error("Gagal membuat deliverable")
      }
    },
  })

  useEffect(() => {
    if (mutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    }
  }, [mutation.isSuccess, queryClient])

  const handleCancel = () => router.push("/admin/deliverables")

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icons.page className="size-4 text-primary" />
            Informasi Dasar
          </CardTitle>
          <CardDescription className="text-xs">
            Buat draf konten, brief, atau laporan untuk brand klien.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form.AppField
            name="title"
            children={(field) => (
              <field.TextField label="Judul Deliverable" required />
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.AppField
              name="client_id"
              children={(field) => (
                <field.SelectField
                  label="Klien"
                  options={clientOptions}
                  required
                />
              )}
            />

            <form.AppField
              name="type"
              children={(field) => (
                <field.SelectField
                  label="Tipe Deliverable"
                  options={[
                    { value: "content", label: "Konten" },
                    { value: "brief", label: "Brief" },
                    { value: "report", label: "Laporan" },
                  ]}
                />
              )}
            />
          </div>

          <form.AppField
            name="content"
            children={(field) => (
              <field.TextareaField label="Isi Konten (Markdown didukung)" />
            )}
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t p-4 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={mutation.isPending}
          >
            Batal
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="button"
                onClick={() => form.handleSubmit()}
                disabled={!canSubmit || mutation.isPending}
                isLoading={isSubmitting || mutation.isPending}
                className="bg-brand-accent hover:bg-brand-accent/90"
              >
                Simpan Deliverable
              </Button>
            )}
          />
        </CardFooter>
      </Card>
    </div>
  )
}