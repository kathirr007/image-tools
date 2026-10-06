# Image Tools — Optimize & Convert (Nuxt 4 + split deploy)

Upload → optimize/convert → download. Frontend Nuxt 4 SPA on Vercel + standalone Node backend (Express + `sharp`). No subscription, no storage — files processed in-memory.

## Routes (frontend)

- `/optimize` — quality / format / resize / metadata / lossless → `POST {API}/api/v1/optimize`
- `/convert` — target format (+optional resize) → `POST {API}/api/v1/convert`
- `GET {API}/api/health` — `{ ok: true, maxUploadMB: 25 }`

API returns the processed image binary with `Content-Disposition: attachment` + stat headers (`X-Original-Size`, `X-Optimized-Size`, `X-Savings-Percent`, `X-Output-Format/Width/Height`).

## Quick start (local, same-origin fallback)

```bash
pnpm install
pnpm dev        # http://localhost:3000 (uses built-in Nitro routes, 4.5MB cap)
```

## Option B: split deploy (production, 25MB / 8000px)

```bash
# terminal 1 — backend :3001
npm install --prefix backend
PORT=3001 FRONTEND_ORIGIN=http://localhost:3000 node backend/src/index.js

# terminal 2 — frontend :3000 → backend :3001
NUXT_PUBLIC_API_BASE=http://localhost:3001 pnpm dev
```

Deploy: frontend → Vercel (Nuxt preset, Node 20, env `NUXT_PUBLIC_API_BASE=https://<backend>`); backend → Fly/Render/VM via `backend/Dockerfile` (`EXPOSE 3001`, env `PORT`, `FRONTEND_ORIGIN=https://<vercel-app>`). No `vercel.json` needed for the frontend.

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
