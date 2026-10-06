<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({
  title: 'Image Tools — Optimize & Convert',
  description: 'Upload, optimize, convert and download images. Free, fast, Vercel-hosted Nuxt app.'
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/optimize"
          class="flex items-center gap-2 font-semibold"
        >
          <UIcon
            name="i-lucide-image"
            class="size-5"
          />
          Image Tools
        </NuxtLink>
        <ToolTabs />
      </template>
      <template #right>
        <UColorModeButton />
        <UButton
          to="/api/health"
          target="_blank"
          icon="i-lucide-activity"
          aria-label="API health"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </template>
    </UHeader>

    <UMain class="mx-auto max-w-6xl px-4 py-6">
      <NuxtPage />
      <USeparator class="my-6" />
      <p class="text-xs text-muted text-center">
        Split deploy: frontend on Vercel, processing on dedicated backend (25MB / 8000px). Files are processed in-memory and never stored.
      </p>
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Nuxt 4 + sharp · © {{ new Date().getFullYear() }}
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
