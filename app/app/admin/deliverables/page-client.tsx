'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { StatusBadge, TypeBadge } from '@/components/deliverable/status-badge'
import { FileText, Link as LinkIcon, MessageSquareIcon, UsersIcon, FilterIcon, XIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from "motion/react"
import type { Deliverable } from '@/lib/supabase/types'

interface DeliverableWithClient extends Deliverable {
  clients?: { name: string; contact_email: string | null } | null
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'revision_requested', label: 'Revisi' },
] as const

const TYPE_FILTERS = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'brief', label: 'Brief' },
  { value: 'content', label: 'Konten' },
  { value: 'report', label: 'Laporan' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']
type TypeFilter = (typeof TYPE_FILTERS)[number]['value']

function SegmentedPills<T extends string>({
  options, value, onChange,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl border bg-muted/40 p-1" role="group" aria-label="Filter">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors lg:min-h-9 lg:px-3 lg:py-1.5 ${
            value === o.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function DeliverablesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all'
  )
  const [type, setType] = useState<TypeFilter>(
    (searchParams.get('type') as TypeFilter) || 'all'
  )
  const clientId = searchParams.get('client') || undefined
  const [clientName, setClientName] = useState<string | null>(null)

  const [deliverables, setDeliverables] = useState<DeliverableWithClient[]>([])
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'all') params.delete('status')
    else params.set('status', status)
    if (type === 'all') params.delete('type')
    else params.set('type', type)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
  }, [status, type, pathname, searchParams])

  useEffect(() => {
    if (!clientId) { setClientName(null); return }
    supabase
      .from('clients').select('name').eq('id', clientId).single()
      .then(({ data }) => setClientName(data?.name ?? null))
  }, [clientId, supabase])

  const loadDeliverables = useCallback(async () => {
    setLoading(true)
    const query = supabase
      .from('deliverables')
      .select(`*, clients!left (name, contact_email)`)

    if (status !== 'all') query.eq('status', status)
    if (type !== 'all') query.eq('type', type)
    if (clientId) query.eq('client_id', clientId)

    query.order('updated_at', { ascending: false })

    const { data, error } = await query
    const rows = (!error && data ? (data as unknown as DeliverableWithClient[]) : [])
    setDeliverables(rows)

    if (rows.length > 0) {
      const ids = rows.map((r) => r.id)
      const { data: cs } = await supabase
        .from('comments').select('deliverable_id').in('deliverable_id', ids)
      const counts: Record<string, number> = {}
      for (const c of cs ?? []) {
        counts[c.deliverable_id] = (counts[c.deliverable_id] ?? 0) + 1
      }
      setCommentCounts(counts)
    } else {
      setCommentCounts({})
    }
    setLoading(false)
  }, [status, type, clientId, supabase])

  useEffect(() => { loadDeliverables() }, [loadDeliverables])

  const isFiltered = status !== 'all' || type !== 'all'
  const hasActiveClientFilter = !!clientId

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {clientName ? `Deliverable: ${clientName}` : 'Deliverables'}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {clientName ? 'Semua deliverable untuk client ini' : 'Semua deliverable yang sedang dikerjakan'}
          </p>
        </div>
        <Button onClick={() => router.push('/admin/deliverables/new')} className="h-11">
          <PlusIcon className="size-4 mr-1.5" />
          Deliverable Baru
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <FilterIcon className="size-4 text-neutral-400 shrink-0" />
          <SegmentedPills options={STATUS_FILTERS} value={status} onChange={setStatus} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterIcon className="size-4 text-neutral-400 shrink-0" />
          <SegmentedPills options={TYPE_FILTERS} value={type} onChange={setType} />
        </div>
        {hasActiveClientFilter && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors lg:min-h-9 lg:px-3 lg:py-1.5 shadow-sm"
          >
            <UsersIcon className="size-3.5" />
            Filter: {clientName} (klik untuk reset)
            <XIcon className="size-3.5" />
          </button>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="animate-pulse"
            >
              <div className="h-28 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50" />
            </motion.div>
          ))}
        </div>
      ) : deliverables.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="border border-dashed border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-3xl shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
              <FileText className="size-8 text-neutral-300 dark:text-neutral-700" />
              <p className="text-center font-medium">{isFiltered ? 'Tidak ada deliverable yang cocok dengan filter.' : 'Belum ada deliverable.'}</p>
              {isFiltered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setStatus('all'); setType('all') }}
                  className="mt-2"
                >
                  Reset filter
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-4">
          <AnimatePresence mode="popLayout">
          {deliverables.map((d, index) => {
            const comments = commentCounts[d.id] ?? 0
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.05 }}
                key={d.id}
              >
                <Link href={`/admin/deliverables/${d.id}`} className="block group">
                  <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-primary transition-colors">{d.title}</h2>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                          <TypeBadge type={d.type} className="h-6 px-2.5 rounded-full" />
                          <StatusBadge status={d.status} className="h-6 px-2.5 rounded-full" />
                          <span className="truncate max-w-[200px] flex items-center gap-1.5 ml-2 border-l border-neutral-200 dark:border-neutral-800 pl-3">
                            <UsersIcon className="w-3.5 h-3.5" />
                            {d.clients?.name || 'Client belum ditentukan'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                        <span className="text-xs font-medium text-neutral-400 tabular-nums bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 rounded-md">
                          {new Date(d.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        {comments > 0 && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md mt-1">
                            <MessageSquareIcon className="size-3.5" /> {comments}
                          </span>
                        )}
                      </div>
                    </div>
                    {d.external_link && (
                      <a
                        href={d.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <LinkIcon className="size-4 shrink-0" />
                        Buka tautan eksternal
                      </a>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}