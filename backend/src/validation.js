// Shared limits for Option B production backend (no Vercel 4.5MB cap).
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 // 25MB per image
export const MAX_DIMENSION = 8000
export const MAX_PIXELS = 50_000_000 // ~50MP guard against decompression bombs / OOM

export const ALLOWED_OUTPUT_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'avif'])
export const ALLOWED_FITS = new Set(['cover', 'contain', 'inside', 'fill'])

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

function parseIntOrUndefined(v) {
  if (v === undefined || v === null || v === '')
    return undefined
  const n = Number.parseInt(String(v), 10)
  return Number.isFinite(n) ? n : undefined
}

export function parseOptions(input, { defaultQuality }) {
  const rawFormat = String(input.format ?? 'original').toLowerCase()
  const format = rawFormat === 'original' ? 'original' : rawFormat
  if (format !== 'original' && !ALLOWED_OUTPUT_FORMATS.has(format))
    throw new HttpError(400, `Unsupported format: ${rawFormat}`)

  const quality = Math.round(Number(input.quality === undefined ? defaultQuality : input.quality))
  if (!Number.isFinite(quality) || quality < 10 || quality > 100)
    throw new HttpError(400, 'quality must be 10-100')

  const width = parseIntOrUndefined(input.width)
  const height = parseIntOrUndefined(input.height)
  if (width !== undefined && (width < 1 || width > MAX_DIMENSION))
    throw new HttpError(400, `width must be 1-${MAX_DIMENSION}`)
  if (height !== undefined && (height < 1 || height > MAX_DIMENSION))
    throw new HttpError(400, `height must be 1-${MAX_DIMENSION}`)

  const fit = String(input.fit ?? 'inside').toLowerCase()
  if (!ALLOWED_FITS.has(fit))
    throw new HttpError(400, `Unsupported fit: ${fit}`)

  return {
    format,
    quality,
    width,
    height,
    fit,
    stripMetadata: String(input.stripMetadata ?? 'true') !== 'false',
    lossless: String(input.lossless ?? 'false') === 'true'
  }
}

export function outputFileName(originalName, format, suffix) {
  const base = String(originalName ?? 'image').split('/').pop()?.split('\\').pop() ?? 'image'
  const stem = base.includes('.') ? base.slice(0, base.lastIndexOf('.')) : base
  const safe = stem.replace(/[^\w.-]+/g, '-').slice(0, 80) || 'image'
  return `${safe}-${suffix}.${format}`
}
