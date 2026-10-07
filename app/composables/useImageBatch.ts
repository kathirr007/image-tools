import { CLIENT_MAX_BYTES, formatBytes, type JobStats, type ToolOptions } from './useImageJob'

export type BatchStatus = 'queued' | 'processing' | 'done' | 'error' | 'skipped'

export interface BatchItem {
  id: number
  file: File
  previewUrl: string
  status: BatchStatus
  resultUrl: string | null
  stats: JobStats | null
  error: string | null
}

export const MAX_BATCH_FILES = 10
const CONCURRENCY = 3

let nextId = 1

/** Multi-file batch: one backend request per file, max 3 in flight. */
export function useImageBatch(endpoint: '/api/v1/optimize' | '/api/v1/convert') {
  const items = ref<BatchItem[]>([])
  const running = ref(false)
  const limitWarning = ref<string | null>(null)

  const processableCount = computed(() => items.value.filter(i => i.status === 'queued' || i.status === 'error').length)
  const doneCount = computed(() => items.value.filter(i => i.status === 'done').length)
  const summary = computed(() => {
    const done = items.value.filter(i => i.status === 'done' && i.stats)
    const original = done.reduce((s, i) => s + (i.stats?.originalSize ?? 0), 0)
    const out = done.reduce((s, i) => s + (i.stats?.optimizedSize ?? 0), 0)
    return {
      done: done.length,
      total: items.value.length,
      original,
      out,
      savings: original > 0 ? Math.round((1 - out / original) * 1000) / 10 : 0
    }
  })

  function addFiles(files: File[]) {
    limitWarning.value = null
    const room = MAX_BATCH_FILES - items.value.length
    if (room <= 0) {
      limitWarning.value = `Max ${MAX_BATCH_FILES} images per batch.`
      return
    }
    const accepted = files.filter(f => f.type.startsWith('image/')).slice(0, room)
    if (files.length > accepted.length)
      limitWarning.value = `Only first ${accepted.length} image(s) added (max ${MAX_BATCH_FILES} per batch).`
    for (const f of accepted) {
      if (f.size > CLIENT_MAX_BYTES) {
        items.value.push({
          id: nextId++,
          file: f,
          previewUrl: URL.createObjectURL(f),
          status: 'skipped',
          resultUrl: null,
          stats: null,
          error: `File is ${formatBytes(f.size)} — max is ${formatBytes(CLIENT_MAX_BYTES)} per image.`
        })
      } else {
        items.value.push({
          id: nextId++,
          file: f,
          previewUrl: URL.createObjectURL(f),
          status: 'queued',
          resultUrl: null,
          stats: null,
          error: null
        })
      }
    }
  }

  function revokeItem(item: BatchItem) {
    URL.revokeObjectURL(item.previewUrl)
    if (item.resultUrl)
      URL.revokeObjectURL(item.resultUrl)
  }

  function removeItem(id: number) {
    const idx = items.value.findIndex(i => i.id === id)
    const item = idx >= 0 ? items.value[idx] : undefined
    if (item) {
      revokeItem(item)
      items.value.splice(idx, 1)
    }
  }

  function clear() {
    for (const i of items.value) revokeItem(i)
    items.value = []
    limitWarning.value = null
  }

  async function processOne(item: BatchItem, options: ToolOptions) {
    item.status = 'processing'
    item.error = null
    try {
      const form = new FormData()
      form.append('image', item.file, item.file.name)
      form.append('format', options.format)
      form.append('quality', String(options.quality))
      form.append('fit', options.fit)
      form.append('stripMetadata', String(options.stripMetadata))
      form.append('lossless', String(options.lossless))
      if (options.width)
        form.append('width', String(options.width))
      if (options.height)
        form.append('height', String(options.height))

      const { apiBase } = useRuntimeConfig().public as { apiBase: string }
      const url = `${(apiBase ?? '').replace(/\/$/, '')}${endpoint}`
      const res = await fetch(url, { method: 'POST', body: form })
      if (!res.ok) {
        let msg = `Request failed (${res.status})`
        try {
          const j = await res.json()
          msg = j.statusMessage || j.message || msg
        } catch {
          msg = await res.text().then(t => t.slice(0, 300) || msg).catch(() => msg)
        }
        throw new Error(msg)
      }
      const blob = await res.blob()
      if (item.resultUrl)
        URL.revokeObjectURL(item.resultUrl)
      item.resultUrl = URL.createObjectURL(blob)
      const h = (k: string) => res.headers.get(k)
      const disposition = h('content-disposition') ?? ''
      const m = disposition.match(/filename="?([^";]+)"?/)
      item.stats = {
        originalSize: Number(h('x-original-size') ?? item.file.size),
        optimizedSize: Number(h('x-optimized-size') ?? blob.size),
        savings: Number(h('x-savings-percent') ?? 0),
        format: h('x-output-format') ?? options.format,
        width: h('x-output-width') ?? '',
        height: h('x-output-height') ?? '',
        fileName: m?.[1] ?? `result.${options.format === 'original' ? 'jpg' : options.format}`
      }
      item.status = 'done'
    } catch (e) {
      item.status = 'error'
      item.error = (e as Error).message
    }
  }

  async function submitAll(options: ToolOptions) {
    const queue = items.value.filter(i => i.status === 'queued' || i.status === 'error')
    if (!queue.length || running.value)
      return
    running.value = true
    try {
      const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        let item = queue.shift()
        while (item) {
          await processOne(item, options)
          item = queue.shift()
        }
      })
      await Promise.all(workers)
    } finally {
      running.value = false
    }
  }

  return { items, running, limitWarning, processableCount, doneCount, summary, addFiles, removeItem, clear, submitAll }
}
