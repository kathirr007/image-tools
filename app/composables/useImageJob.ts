export interface ToolOptions {
  format: string
  quality: number
  width?: number | string
  height?: number | string
  fit: string
  stripMetadata: boolean
  lossless: boolean
}

export interface JobStats {
  originalSize: number
  optimizedSize: number
  savings: number
  format: string
  width: string
  height: string
  fileName: string
}

export const CLIENT_MAX_BYTES = 25 * 1024 * 1024 // Option B: 25MB (backend limit)

export function formatBytes(n: number): string {
  if (!Number.isFinite(n))
    return '—'
  if (n < 1024)
    return `${n} B`
  if (n < 1024 * 1024)
    return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export function useImageJob(endpoint: '/api/v1/optimize' | '/api/v1/convert') {
  const file = ref<File | null>(null)
  const previewUrl = ref<string | null>(null)
  const originalSize = ref(0)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const resultUrl = ref<string | null>(null)
  const stats = ref<JobStats | null>(null)

  function setFile(f: File | null) {
    // revoke old URLs to avoid leaks
    if (previewUrl.value)
      URL.revokeObjectURL(previewUrl.value)
    if (resultUrl.value)
      URL.revokeObjectURL(resultUrl.value)
    previewUrl.value = null
    resultUrl.value = null
    stats.value = null
    error.value = null
    file.value = f
    if (f) {
      previewUrl.value = URL.createObjectURL(f)
      originalSize.value = f.size
      if (f.size > CLIENT_MAX_BYTES)
        error.value = `File is ${formatBytes(f.size)} — max is ${formatBytes(CLIENT_MAX_BYTES)}. Try a smaller file.`
    }
  }

  async function submit(options: ToolOptions) {
    error.value = null
    stats.value = null
    if (!file.value) {
      error.value = 'Upload an image first.'
      return
    }
    if (file.value.size > CLIENT_MAX_BYTES) {
      error.value = `File too large (max ${formatBytes(CLIENT_MAX_BYTES)}).`
      return
    }
    isProcessing.value = true
    try {
      const form = new FormData()
      form.append('image', file.value, file.value.name)
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
        }
        catch {
          msg = await res.text().then(t => t.slice(0, 300) || msg).catch(() => msg)
        }
        throw new Error(msg)
      }
      const blob = await res.blob()
      if (resultUrl.value)
        URL.revokeObjectURL(resultUrl.value)
      resultUrl.value = URL.createObjectURL(blob)
      const h = (k: string) => res.headers.get(k)
      const disposition = h('content-disposition') ?? ''
      const m = disposition.match(/filename="?([^";]+)"?/)
      stats.value = {
        originalSize: Number(h('x-original-size') ?? file.value.size),
        optimizedSize: Number(h('x-optimized-size') ?? blob.size),
        savings: Number(h('x-savings-percent') ?? 0),
        format: h('x-output-format') ?? options.format,
        width: h('x-output-width') ?? '',
        height: h('x-output-height') ?? '',
        fileName: m?.[1] ?? `result.${options.format === 'original' ? 'jpg' : options.format}`
      }
    }
    catch (e) {
      error.value = (e as Error).message
    }
    finally {
      isProcessing.value = false
    }
  }

  return { file, previewUrl, originalSize, isProcessing, error, resultUrl, stats, setFile, submit }
}
