# Image Tools — Optimize & Convert (Nuxt 4 + Vercel)

Upload → optimize/convert → download. Nuxt 4 SPA + Nitro server routes + `sharp`. No subscription, no storage — files processed in-memory.

## Routes

- `/optimize` — quality / format / resize / metadata / lossless → `POST /api/v1/optimize`
- `/convert` — target format (+optional resize) → `POST /api/v1/convert`
- `GET /api/health` — `{ ok: true }`

API returns the processed image binary with `Content-Disposition: attachment` + stat headers (`X-Original-Size`, `X-Optimized-Size`, `X-Savings-Percent`, `X-Output-Format/Width/Height`).

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Deploy to Vercel

Import the repo, framework preset **Nuxt**, Node 20. No `vercel.json` needed (Nitro `vercel` preset). Hobby limits: **~4.5MB request body, 10s execution** — client guards at 4MB, default cap 3000–4000px, AVIF on low effort.

## Project layout

```
app/pages/optimize.vue, convert.vue   # tool pages
app/components/ImageUploader|OptionsForm|ResultCompare|ToolTabs.vue
app/composables/useImageJob.ts        # upload + fetch blob + stats
server/utils/pipeline.ts              # shared sharp pipeline (all tools reuse)
server/utils/validation.ts            # limits: 4.5MB, formats, 1–4000px, quality 10–100
server/api/v1/optimize.post.ts | convert.post.ts
```

Add a future tool = 1 page + 1 `server/api/v1/<tool>.post.ts` calling `processImage()`.

## Verify

```bash
pnpm build   # prerenders /, /optimize, /convert + vercel functions
```
