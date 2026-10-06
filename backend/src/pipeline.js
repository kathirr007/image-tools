import sharp from 'sharp'
import { MAX_PIXELS } from './validation.js'

/**
 * Shared sharp pipeline (mirrors Nuxt server/utils/pipeline.ts).
 * Backend allows larger dimensions but guards total pixels for memory safety.
 */
export async function processImage(input, options) {
  const meta = await sharp(input, { failOn: 'none' }).metadata()
  const pixels = (meta.width ?? 0) * (meta.height ?? 0)
  if (pixels > MAX_PIXELS)
    throw new Error(`Image too large (${meta.width}x${meta.height}); max ~50MP`)

  let pipeline = sharp(input, { failOn: 'none' }).rotate()
  let target = options.format === 'original' ? (meta.format ?? 'png').toLowerCase() : options.format
  if (target === 'jpg')
    target = 'jpeg'
  if (target === 'tiff' || target === 'unknown' || !target)
    target = 'png'

  if (options.width !== undefined || options.height !== undefined) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: options.fit,
      withoutEnlargement: true
    })
  }

  if (target === 'jpeg' && (meta.hasAlpha || (meta.format ?? '').toLowerCase() === 'png'))
    pipeline = pipeline.flatten({ background: '#ffffff' })

  if (!options.stripMetadata)
    pipeline = pipeline.keepMetadata()

  switch (target) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true })
      break
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9, palette: !options.lossless })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality: options.quality, lossless: options.lossless, effort: 5 })
      break
    case 'avif':
      pipeline = pipeline.avif({ quality: options.quality, lossless: options.lossless, effort: 5 })
      break
    default:
      throw new Error(`Unsupported target format: ${target}`)
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
  const format = target === 'jpeg' ? 'jpg' : target
  return { data: Buffer.from(data), info, format }
}
