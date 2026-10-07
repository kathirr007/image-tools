// https://nuxt.com/docs/api/configuration/nuxt-config
//
// Office / restricted-network mode:
//   pnpm dev:office   (sets NUXT_OFFLINE=1, see scripts/dev-office.mjs)
// or manually:
//   $env:NUXT_OFFLINE='1'; pnpm dev   (PowerShell)
//   NUXT_OFFLINE=1 pnpm dev           (bash)
//
// When NUXT_OFFLINE=1 (or OFFICE=1 / NUXT_OFFLINE_FONTS=1):
// - @nuxt/fonts is NOT installed (ui.fonts=false), so no request to
//   fonts.googleapis.com / fonts.gstatic.com is ever made. The CSS keeps
//   'Public Sans' first but falls back to system fonts (see main.css).
// - @nuxt/icon uses same-origin server provider with no api.iconify.design
//   fallback, so only locally installed collections are used.
// Default (env unset): previous behaviour, remote fonts + iconify fallback.
const isOffline
  = process.env.NUXT_OFFLINE === '1'
    || process.env.OFFICE === '1'
    || process.env.NUXT_OFFLINE_FONTS === '1'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  // SPA tool: no SSR benefit for file-input heavy UI; avoids hydration issues.
  // Flip to ssr:true later if you add SEO/marketing pages.
  ssr: false,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Offline-safe: disable remote font download + remote icon API.
  // Verified against @nuxt/ui 4.11 module.mjs:
  // `...userUiOptions.fonts !== false && { "@nuxt/fonts": ... }`
  ui: isOffline ? { fonts: false } : {},

  // Option B split deploy: frontend on Vercel, heavy processing on dedicated backend.
  // Set NUXT_PUBLIC_API_BASE=https://your-backend.fly.dev (no trailing slash).
  // Empty = same-origin Nuxt server routes (local dev / pure-Vercel fallback).
  runtimeConfig: {
    public: {
      apiBase: ''
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/optimize': { prerender: true },
    '/convert': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    // sharp needs Node runtime (never edge) + room for image buffers
    preset: 'vercel'
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: isOffline
    ? {
        // Same-origin /api/_nuxt_icon only; never hit api.iconify.design.
        provider: 'server',
        fallbackToApi: false
      }
    : {}
})
