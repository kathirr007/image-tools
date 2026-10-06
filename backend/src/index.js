import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { HttpError, MAX_UPLOAD_BYTES, outputFileName, parseOptions } from './validation.js'
import { processImage } from './pipeline.js'

const PORT = Number(process.env.PORT ?? 3001)
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean)

const app = express()
app.disable('x-powered-by')
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(morgan('tiny'))
app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / curl (no origin) + configured Vercel domains
    if (!origin || FRONTEND_ORIGIN.includes('*') || FRONTEND_ORIGIN.includes(origin))
      return cb(null, true)
    return cb(new Error(`CORS blocked for ${origin}`))
  },
  exposedHeaders: ['Content-Disposition', 'X-Original-Size', 'X-Optimized-Size', 'X-Savings-Percent', 'X-Output-Format', 'X-Output-Width', 'X-Output-Height']
}))
app.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-7' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'image-tools-backend', maxUploadMB: MAX_UPLOAD_BYTES / 1024 / 1024 })
})

async function handleImage(req, res, { defaultQuality, suffix, requireFormat }) {
  if (!req.file)
    throw new HttpError(400, 'Missing "image" file field')
  const options = parseOptions(req.body ?? {}, { defaultQuality })
  if (requireFormat && options.format === 'original')
    throw new HttpError(400, 'Choose a target format for conversion')

  let result
  try {
    result = await processImage(req.file.buffer, options)
  }
  catch (err) {
    throw new HttpError(422, `Could not process image: ${err.message}`)
  }

  const originalSize = req.file.size
  const outSize = result.data.length
  const savings = originalSize > 0 ? Math.round((1 - outSize / originalSize) * 1000) / 10 : 0
  const downloadName = outputFileName(req.file.originalname, result.format, suffix)

  res.setHeader('Content-Type', `image/${result.format === 'jpg' ? 'jpeg' : result.format}`)
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`)
  res.setHeader('X-Original-Size', String(originalSize))
  res.setHeader('X-Optimized-Size', String(outSize))
  res.setHeader('X-Savings-Percent', String(savings))
  res.setHeader('X-Output-Format', result.format)
  res.setHeader('X-Output-Width', String(result.info.width ?? ''))
  res.setHeader('X-Output-Height', String(result.info.height ?? ''))
  res.send(result.data)
}

app.post('/api/v1/optimize', upload.single('image'), async (req, res, next) => {
  try {
    await handleImage(req, res, { defaultQuality: 80, suffix: 'optimized', requireFormat: false })
  }
  catch (e) { next(e) }
})

app.post('/api/v1/convert', upload.single('image'), async (req, res, next) => {
  try {
    await handleImage(req, res, { defaultQuality: 90, suffix: 'converted', requireFormat: true })
  }
  catch (e) { next(e) }
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ statusCode: 413, statusMessage: 'File too large (max 25MB)' })
  const status = err instanceof HttpError ? err.statusCode : 500
  res.status(status).json({ statusCode: status, statusMessage: err?.message ?? 'Internal error' })
})

app.listen(PORT, () => {
  console.log(`[backend] listening on :${PORT} (max upload ${(MAX_UPLOAD_BYTES / 1048576).toFixed(0)}MB)`)
})
