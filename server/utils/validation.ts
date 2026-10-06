export const MAX_UPLOAD_BYTES = 4_500_000 // Vercel Hobby body limit
export const CLIENT_WARN_BYTES = 4_000_000 // client-side guard for MVP

export const ALLOWED_INPUT_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff'])
export const ALLOWED_OUTPUT_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif'])
export const ALLOWED_FITS = new Set(['cover', 'contain', 'inside', 'fill'])

export type ResizeFit = 'cover' | 'contain' | 'inside' | 'fill'

export interface OptimizeOptions {
  format: string // 'original' | jpeg | png | webp | avif
  quality: number // 10-100
  width?: number
  height?: number
  fit: ResizeFit
  stripMetadata: boolean
  lossless: boolean
}

export function parseIntOrUndefined(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '')
    return undefined
  const n = Number.parseInt(String(v), 10)
  return Number.isFinite(n) ? n : undefined
}

export function parseOptions(input: Record<string, unknown>, opts: { defaultQuality: number }): OptimizeOptions {
  const rawFormat = String(input.format ?? 'original').toLowerCase()
  const format = rawFormat === 'original' ? 'original' : rawFormat
  if (format !== 'original' && !ALLOWED_OUTPUT_FORMATS.has(format))
    throw createError({ statusCode: 400, statusMessage: `Unsupported format: ${rawFormat}` })

  const qualityRaw = input.quality === undefined ? opts.defaultQuality : Number(input.quality)
  const quality = Math.round(Number(qualityRaw))
  if (!Number.isFinite(quality) || quality < 10 || quality > 100)
    throw createError({ statusCode: 400, statusMessage: 'quality must be 10-100' })

  const width = parseIntOrUndefined(input.width)
  const height = parseIntOrUndefined(input.height)
  if (width !== undefined && (width < 1 || width > 4000))
    throw createError({ statusCode: 400, statusMessage: 'width must be 1-4000' })
  if (height !== undefined && (height < 1 || height > 4000))
    throw createError({ statusCode: 400, statusMessage: 'height must be 1-4000' })

  const fit = String(input.fit ?? 'inside').toLowerCase()
  if (!ALLOWED_FITS.has(fit))
    throw createError({ statusCode: 400, statusMessage: `Unsupported fit: ${fit}` })

  const stripMetadata = String(input.stripMetadata ?? 'true') !== 'false'
  const lossless = String(input.lossless ?? 'false') === 'true'

  return { format, quality, width, height, fit: fit as ResizeFit, stripMetadata, lossless }
}

export function outputFileName(originalName: string | undefined, format: string, suffix: string): string {
  const base = (originalName ?? 'image').split('/').pop()?.split('\\').pop() ?? 'image'
  const stem = base.includes('.') ? base.slice(0, base.lastIndexOf('.')) : base
  const safe = stem.replace(/[^\w.-]+/g, '-').slice(0, 80) || 'image'
  return `${safe}-${suffix}.${format}`
}
