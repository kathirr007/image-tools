<script setup lang="ts">
const tools = [
  {
    to: '/optimize',
    icon: 'i-lucide-zap',
    title: 'Optimize',
    description: 'Compress, resize and fine-tune quality. Shrink file size with minimal visible loss.',
    bullets: ['Quality slider', 'Resize + fit modes', 'Strip metadata'],
    cta: 'Open optimizer'
  },
  {
    to: '/convert',
    icon: 'i-lucide-repeat',
    title: 'Convert',
    description: 'Switch formats between JPEG, PNG, WebP and AVIF in one click.',
    bullets: ['4 output formats', 'Optional resize', 'Lossless toggle'],
    cta: 'Open converter'
  }
]
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="text-center flex flex-col items-center gap-4 pt-4">
      <UBadge
        icon="i-lucide-image"
        color="neutral"
        variant="soft"
      >
        Free · No signup · Files never stored
      </UBadge>
      <h1 class="text-4xl font-bold tracking-tight">
        Image Tools
      </h1>
      <p class="text-muted max-w-xl">
        Upload an image, pick a tool, and download the result.
        Processing happens in-memory on the server — nothing is saved.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <UCard
        v-for="t in tools"
        :key="t.to"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              :name="t.icon"
              class="size-5 text-primary"
            />
            <span class="font-semibold text-lg">{{ t.title }}</span>
          </div>
        </template>
        <p class="text-sm text-muted">
          {{ t.description }}
        </p>
        <ul class="mt-3 flex flex-col gap-1 text-sm">
          <li
            v-for="b in t.bullets"
            :key="b"
            class="flex items-center gap-2"
          >
            <UIcon
              name="i-lucide-check"
              class="size-4 text-success"
            />
            {{ b }}
          </li>
        </ul>
        <template #footer>
          <UButton
            :to="t.to"
            :icon="t.icon"
            block
            size="lg"
          >
            {{ t.cta }}
          </UButton>
        </template>
      </UCard>
    </div>

    <UCard variant="soft">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="text-sm">
          <p class="font-semibold">
            How it works
          </p>
          <p class="text-muted">
            1 · Upload &nbsp;→&nbsp; 2 · Choose options &nbsp;→&nbsp; 3 · Download the processed file with savings stats.
          </p>
        </div>
        <ToolTabs />
      </div>
    </UCard>
  </div>
</template>
