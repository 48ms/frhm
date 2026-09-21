"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileTextIcon,
  PenLineIcon,
  UploadCloudIcon,
  Loader2,
} from "lucide-react"
import { RippleButton } from "@/components/motion/ripple-button"
import { toast } from "sonner"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs"

const deliverableSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  client_id: z.string().min(1, "Pilih klien terlebih dahulu"),
  type: z.enum(["content", "brief", "report"]),
  content: z.string(),
})

type DeliverableFormValues = z.infer<typeof deliverableSchema>

type ClientOption = { id: string; name: string }

export default function NewDeliverablePage() {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const form = useForm<DeliverableFormValues>({
    resolver: zodResolver(deliverableSchema),
    defaultValues: {
      title: "",
      client_id: "",
      type: "content",
      content: "",
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const title = watch("title")
  const clientId = watch("client_id")
  const content = watch("content")
  const type = watch("type")

  useEffect(() => {
    fetch("/api/admin/clients?all=true&limit=100")
      .then((r) => r.json())
      .then((j) => setClients(j.clients ?? []))
      .catch(() => setClients([]))
  }, [])

  const onSubmit = useCallback(async (data: DeliverableFormValues) => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal membuat deliverable")

      toast.success("Deliverable berhasil dibuat")
      router.push(`/admin/deliverables/${json.deliverable.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat deliverable")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleCancel = () => {
    router.push("/admin/deliverables")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="write">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Buat Deliverable Baru
          </h1>
          <p className="text-sm text-muted-foreground">
            Isi informasi di bawah untuk membuat deliverable konten baru.
          </p>
        </div>

        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="write" className="h-11 rounded-xl">Tulis Konten</TabsTrigger>
          <TabsTrigger value="upload" className="h-11 rounded-xl">Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="write">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="size-5 text-primary" />
                  Informasi Dasar
                </CardTitle>
                <CardDescription>
                  Buat draf konten, brief, atau laporan untuk brand klien.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-foreground">
                    Judul Deliverable *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Mis. Ringkasan Bulanan Media Sosial"
                    {...register("title")}
                    required
                    className="w-full rounded-xl h-11"
                    aria-invalid={!!errors.title}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Judul akan ditampilkan di dashboard dan notifikasi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="client" className="text-sm font-medium text-foreground">
                      Klien *
                    </Label>
                    <Select
                      value={clientId}
                      onValueChange={(v) => setValue("client_id", v ?? "", { shouldValidate: true })}
                    >
                      <SelectTrigger id="client" className="w-full rounded-xl h-11">
                        <SelectValue placeholder="Pilih klien..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.client_id && (
                      <p className="text-xs text-destructive">{errors.client_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-foreground">
                      Tipe
                    </Label>
                    <Select
                      value={type}
                      onValueChange={(v) => setValue("type", v as "content" | "brief" | "report", { shouldValidate: true })}
                    >
                      <SelectTrigger id="type" className="w-full rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content">Konten</SelectItem>
                        <SelectItem value="brief">Brief</SelectItem>
                        <SelectItem value="report">Laporan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium text-foreground flex items-center justify-between">
                    <span>Konten</span>
                    <PenLineIcon className="size-4 text-muted-foreground" />
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Tulis konten lengkap di sini (dukung markdown)..."
                    {...register("content")}
                    className="min-h-[300px] font-mono text-sm resize-y rounded-xl"
                    aria-invalid={!!errors.content}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 border-t px-6 py-4">
                <div className="flex w-full justify-between">
                  <Button variant="outline" type="button" onClick={handleCancel} className="h-11">
                    Batal
                  </Button>
                  <RippleButton type="submit" disabled={loading} className="h-11">
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Membuat...
                      </>
                    ) : (
                      "Buat Deliverable"
                    )}
                  </RippleButton>
                </div>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="upload">
          <Card className="border border-dashed">
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Fitur upload file akan segera tersedia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg p-8 text-center">
                <UploadCloudIcon className="mx-auto size-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Seret & drop file, atau klik untuk memilih
                </p>
                <Button variant="outline" className="mt-4 h-11" disabled>
                  Belum tersedia
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}