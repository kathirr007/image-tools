<script setup lang="ts">
import type { BatchItem } from '~/composables/useImageBatch'
import { formatBytes } from '~/composables/useImageJob'

defineProps<{
  items: BatchItem[]
  running: boolean
  done: number
  total: number
  totalSaved: number
}>()
</script>

<template>
  <UCard>
    <template #header>
      <span class="font-semibold">3 · Results & downloads ({{ done }}/{{ total }})</span>
    </template>
    <div
      v-if="running && done === 0"
      class="text-center py-8"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin mx-auto"
      />
      <p class="text-sm text-muted mt-2">
        Processing images…
      </p>
    </div>
    <div
      v-else-if="total > 0"
      class="flex flex-col gap-3"
    >
      <div
        v-if="done > 0"
        class="flex flex-wrap gap-2"
      >
        <UBadge
          color="success"
          variant="soft"
        >
          Total saved {{ totalSaved }}%
        </UBadge>
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ done }} of {{ total }} ready
        </UBadge>
      </div>
      <div
        v-for="item in items"
        :key="item.id"
        class="rounded-lg border p-3 flex flex-col gap-2"
      >
        <div class="flex items-center gap-3">
          <img
            :src="item.resultUrl ?? item.previewUrl"
            :alt="item.file.name"
            class="size-14 rounded object-cover shrink-0"
          >
          <div class="min-w-0 flex-1">
            <p class="text-sm truncate">
              {{ item.stats?.fileName ?? item.file.name }}
            </p>
            <p
              v-if="item.stats"
              class="text-xs text-muted"
            >
              {{ formatBytes(item.stats.originalSize) }} → {{ formatBytes(item.stats.optimizedSize) }} · saved {{ item.stats.savings }}%
            </p>
            <p
              v-else-if="item.error"
              class="text-xs text-error"
            >
              {{ item.error }}
            </p>
            <p
              v-else
              class="text-xs text-muted"
            >
              {{ item.status === 'processing' ? 'Working…' : `Queued · ${formatBytes(item.file.size)}` }}
            </p>
          </div>
        </div>
        <a
          v-if="item.resultUrl && item.stats"
          :href="item.resultUrl"
          :download="item.stats.fileName"
        >
          <UButton
            icon="i-lucide-download"
            size="sm"
            block
          >
            Download {{ item.stats.fileName }}
          </UButton>
        </a>
      </div>
    </div>
    <div
      v-else
      class="text-center py-8 text-sm text-muted"
    >
      Upload images and run the tool — per-file downloads appear here.
    </div>
  </UCard>
</template>
