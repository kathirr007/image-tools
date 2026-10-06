import { MAX_UPLOAD_BYTES, outputFileName, parseOptions } from '../../utils/validation'
import { processImage } from '../../utils/pipeline'

/**
 * Convert = format-only by default (lossless-ish, no resize unless asked).
 * Reuses the same pipeline as optimize so future tools stay consistent.
 */
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST')
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'image' && p.data?.length)
  if (!filePart)
    throw createError({ statusCode: 400, statusMessage: 'Missing "image" file field' })

  if (filePart.data.length > MAX_UPLOAD_BYTES)
    throw createError({ statusCode: 413, statusMessage: 'File too large for serverless (max ~4.5MB on Vercel Hobby)' })

  const fields: Record<string, unknown> = {}
  for (const p of parts ?? []) {
    if (!p.name || p.name === 'image' || p.data === undefined)
      continue
    fields[p.name] = p.data.toString('utf8')
  }

  if (!fields.format || String(fields.format).toLowerCase() === 'original')
    throw createError({ statusCode: 400, statusMessage: 'Choose a target format for conversion' })

  // Conversion defaults to high quality; resize only if width/height supplied
  const options = parseOptions(fields, { defaultQuality: 90 })

  let result
  try {
    result = await processImage(Buffer.from(filePart.data), options)
  }
  catch (err) {
    throw createError({ statusCode: 422, statusMessage: `Could not convert image: ${(err as Error).message}` })
  }

  const originalSize = filePart.data.length
  const convertedSize = result.data.length
  const savings = originalSize > 0 ? Math.round((1 - convertedSize / originalSize) * 1000) / 10 : 0
  const downloadName = outputFileName(filePart.filename, result.format, 'converted')

  setResponseHeaders(event, {
    'Content-Type': `image/${result.format === 'jpg' ? 'jpeg' : result.format}`,
    'Content-Disposition': `attachment; filename="${downloadName}"`,
    'X-Original-Size': String(originalSize),
    'X-Optimized-Size': String(convertedSize),
    'X-Savings-Percent': String(savings),
    'X-Output-Format': result.format,
    'X-Output-Width': String(result.info.width ?? ''),
    'X-Output-Height': String(result.info.height ?? '')
  })

  return result.data
})
