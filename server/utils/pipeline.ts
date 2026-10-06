import sharp from 'sharp'
import type { OptimizeOptions } from './validation'

export interface ProcessedImage {
  data: Buffer
  info: sharp.OutputInfo
  format: string
}

function detectInputFormat(meta: sharp.Metadata): string {
  return (meta.format ?? 'unknown').toLowerCase()
}

/** Shared sharp pipeline used by optimize / convert / future tools. */
export async function processImage(input: Buffer, options: OptimizeOptions): Promise<ProcessedImage> {
  let pipeline = sharp(input, { failOn: 'none' }).rotate()

  const meta = await sharp(input).metadata()
  const inputFormat = detectInputFormat(meta)

  let target = options.format === 'original' ? inputFormat : options.format
  // sharp uses 'jpeg' not 'jpg'
  if (target === 'jpg')
    target = 'jpeg'
  // tiff input with 'original' -> default to png to keep it viewable
  if ((target === 'tiff' || target === 'unknown'))
    target = 'png'

  if (options.width !== undefined || options.height !== undefined) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: options.fit as keyof sharp.FitEnum,
      withoutEnlargement: true
    })
  }

  // PNG -> JPEG needs flattening (no alpha in jpeg)
  const needsFlatten = target === 'jpeg' && (meta.hasAlpha || inputFormat === 'png')
  if (needsFlatten)
    pipeline = pipeline.flatten({ background: '#ffffff' })

  // Metadata: sharp strips by default; keep ICC/exif only when asked
  if (!options.stripMetadata)
    pipeline = pipeline.keepMetadata()

  switch (target) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true })
      break
    case 'png':
      pipeline = pipeline.png({
        compressionLevel: 9,
        palette: !options.lossless ? true : false
      })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality: options.quality, lossless: options.lossless, effort: 4 })
      break
    case 'avif':
      // low effort to stay inside Vercel 10s timeout
      pipeline = pipeline.avif({ quality: options.quality, lossless: options.lossless, effort: 4 })
      break
    default:
      throw new Error(`Unsupported target format: ${target}`)
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
  return { data: Buffer.from(data), info, format: target === 'jpeg' ? 'jpg' : target }
}
