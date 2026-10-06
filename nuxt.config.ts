// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // SPA tool: no SSR benefit for file-input heavy UI; avoids hydration issues.
  // Flip to ssr:true later if you add SEO/marketing pages.
  ssr: false,

  nitro: {
    // sharp needs Node runtime (never edge) + room for image buffers
    preset: 'vercel'
  },

  routeRules: {
    '/': { prerender: true },
    '/optimize': { prerender: true },
    '/convert': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
