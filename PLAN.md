# Implementation Plan — Nuxt 4 Image Tools (Vercel)

Target: `node-vue-image-optimizer/` — Nuxt 4 SPA + Nitro server routes + sharp, deployable to Vercel Hobby (pure-Vercel MVP, 4.5MB / 10s limits).

## Progress

- [x] Git repo initialized (`master`)
- [x] Scaffold Nuxt 4 project (compatibilityVersion 4, Node 20, SPA mode) — `ui` template, Nuxt 4.5.2 + @nuxt/ui + Tailwind v4, pnpm
- [x] Install deps: `sharp`, UI (Tailwind/Nuxt UI minimal — plain CSS fallback) — in progress
- [x] Shared server pipeline: `server/utils/pipeline.ts` + `validation.ts`
- [x] API: `server/api/v1/optimize.post.ts`
- [x] API: `server/api/v1/convert.post.ts`
- [x] Frontend: `app/` layout + `ToolTabs`, `Uploader`, `OptionsForm`, `ResultCompare`
- [x] Composable: `useImageJob.ts`
- [x] Pages: `index`, `optimize`, `convert`
- [x] Config: `nuxt.config.ts` (ssr:false, vercel preset, Node runtime), `.gitignore`, README, Vercel notes — in progress
- [x] Local verify: `npm run dev` smoke + `npm run build` passes — `pnpm build` ✅ (3 routes prerendered, vercel preset, 22MB total); sharp pipeline ✅ (PNG 14KB → WebP 860B, 94% saved)
- [x] Initial commit — done (`036348b` MVP + `2f38c3b` ignore .vercel)
- [ ] Initial commit

## Decisions (confirmed)
- Nuxt 4 latest (4.5.x), SPA `ssr:false`, Nuxt UI/Tailwind OK, 4MB client cap for MVP.
- Stateless serverless: no disk persistence, immediate binary download + X-* stat headers.
- One pipeline, many tools: optimize = resize+quality+format; convert = format-only.

## Vercel constraints handled
- 4.5MB body: client 4MB guard + 413 handling.
- 10s timeout: cap 3000px default, AVIF low effort, prefer JPEG/WebP.
- sharp = Node runtime only (not edge).

## Future tools (out of MVP)
- resize-only, batch-zip, watermark, crop — add page + `server/api/v1/<tool>.post.ts` reusing `pipeline.ts`.

---
Updated as implementation progresses.
