<script setup lang="ts">
import { formatBytes, type JobStats } from '~/composables/useImageJob'

defineProps<{
  resultUrl: string | null
  stats: JobStats | null
  originalSize: number
  processing: boolean
}>()
</script>

<template>
  <UCard>
    <template #header>
      <span class="font-semibold">3 · Result & download</span>
    </template>
    <div v-if="processing" class="text-center py-8">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin mx-auto" />
      <p class="text-sm text-muted mt-2">
        Processing…
      </p>
    </div>
    <div v-else-if="resultUrl && stats" class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-2">
        <UBadge color="success" variant="soft">
          Saved {{ stats.savings }}%
        </UBadge>
        <UBadge color="neutral" variant="soft">
          {{ formatBytes(stats.originalSize) }} → {{ formatBytes(stats.optimizedSize) }}
        </UBadge>
        <UBadge color="neutral" variant="soft">
          .{{ stats.format }}<span v-if="stats.width"> · {{ stats.width }}×{{ stats.height }}</span>
        </UBadge>
      </div>
      <a :href="resultUrl" :download="stats.fileName">
        <UButton icon="i-lucide-download" size="lg" block>
          Download {{ stats.fileName }}
        </UButton>
      </a>
      <p class="text-xs text-muted text-center">
        Preview opens in a new tab — right-click to copy link.
      </p>
      <a :href="resultUrl" target="_blank" rel="noopener">
        <img :src="resultUrl" alt="processed preview" class="max-h-64 mx-auto rounded-lg object-contain border">
      </a>
    </div>
    <div v-else class="text-center py-8 text-sm text-muted">
      Run the tool to see savings + download here.
      <p class="text-xs mt-1">
        Original: {{ originalSize ? formatBytes(originalSize) : '—' }}
      </p>
    </div>
  </UCard>
</template>
