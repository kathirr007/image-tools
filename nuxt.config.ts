// https://nuxt.com/docs/api/configuration/nuxt-config
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
  }
})
