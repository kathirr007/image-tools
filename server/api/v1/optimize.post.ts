import { MAX_UPLOAD_BYTES, outputFileName, parseOptions } from '../../utils/validation'
import { processImage } from '../../utils/pipeline'

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

  const options = parseOptions(fields, { defaultQuality: 80 })

  let result
  try {
    result = await processImage(Buffer.from(filePart.data), options)
  } catch (err) {
    throw createError({ statusCode: 422, statusMessage: `Could not process image: ${(err as Error).message}` })
  }

  const originalSize = filePart.data.length
  const optimizedSize = result.data.length
  const savings = originalSize > 0 ? Math.round((1 - optimizedSize / originalSize) * 1000) / 10 : 0
  const downloadName = outputFileName(filePart.filename, result.format, 'optimized')

  setResponseHeaders(event, {
    'Content-Type': `image/${result.format === 'jpg' ? 'jpeg' : result.format}`,
    'Content-Disposition': `attachment; filename="${downloadName}"`,
    'X-Original-Size': String(originalSize),
    'X-Optimized-Size': String(optimizedSize),
    'X-Savings-Percent': String(savings),
    'X-Output-Format': result.format,
    'X-Output-Width': String(result.info.width ?? ''),
    'X-Output-Height': String(result.info.height ?? '')
  })

  return result.data
})
