<script setup lang="ts">
import type { BatchItem } from '~/composables/useImageBatch'
import { formatBytes } from '~/composables/useImageJob'

defineProps<{
  items: BatchItem[]
  mode?: 'optimize' | 'convert'
}>()
const emit = defineEmits<{
  (e: 'select', files: File[]): void
  (e: 'remove' | 'runOne', id: number): void
  (e: 'clear'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDrag = ref(false)

function onFiles(files: FileList | File[] | null) {
  if (!files?.length)
    return
  emit('select', Array.from(files))
  if (inputRef.value)
    inputRef.value.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDrag.value = false
  onFiles(e.dataTransfer?.files ?? null)
}

function statusColor(s: BatchItem['status']) {
  return s === 'done' ? 'success' : s === 'processing' ? 'info' : (s === 'error' || s === 'skipped') ? 'error' : 'neutral'
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="font-semibold">1 · Upload images ({{ items.length }})</span>
        <UButton
          v-if="items.length"
          variant="ghost"
          color="neutral"
          size="xs"
          icon="i-lucide-trash-2"
          @click="emit('clear')"
        >
          Clear all
        </UButton>
      </div>
    </template>
    <div
      class="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition"
      :class="isDrag ? 'border-primary bg-primary/5' : 'border-muted'"
      @click="inputRef?.click()"
      @dragover.prevent="isDrag = true"
      @dragleave="isDrag = false"
      @drop="onDrop"
    >
      <UIcon
        name="i-lucide-upload"
        class="size-8 mx-auto text-muted"
      />
      <p class="mt-2 text-sm">
        Drag & drop or <span class="text-primary underline">click to browse</span> — multi-select enabled
      </p>
      <p class="text-xs text-muted mt-1">
        JPG · PNG · WebP · AVIF · TIFF — max 25MB each, up to 10 per batch
      </p>
      <input
        ref="inputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
        multiple
        class="hidden"
        @change="onFiles(($event.target as HTMLInputElement).files)"
      >
    </div>
    <div
      v-if="items.length"
      class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="relative rounded-lg border overflow-hidden"
      >
        <img
          :src="item.previewUrl"
          :alt="item.file.name"
          class="h-24 w-full object-cover"
        >
        <div class="p-1.5">
          <p class="text-xs truncate">
            {{ item.file.name }}
          </p>
          <div class="flex items-center justify-between mt-1">
            <UBadge
              :color="statusColor(item.status)"
              variant="soft"
              size="xs"
            >
              {{ item.status === 'processing' ? 'working…' : `${item.status} · ${formatBytes(item.file.size)}` }}
            </UBadge>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-lucide-x"
              aria-label="Remove image"
              @click="emit('remove', item.id)"
            />
          </div>
          <div class="mt-2 pt-1 border-t border-muted/20">
            <UButton
              v-if="item.status === 'queued'"
              size="xs"
              variant="subtle"
              block
              :icon="mode === 'convert' ? 'i-lucide-arrow-right-left' : 'i-lucide-sparkles'"
              @click="emit('runOne', item.id)"
            >
              {{ mode === 'convert' ? 'Convert' : 'Optimize' }}
            </UButton>
            <UButton
              v-else-if="item.status === 'processing'"
              size="xs"
              variant="subtle"
              block
              loading
              disabled
            >
              Processing…
            </UButton>
            <UButton
              v-else-if="item.status === 'error'"
              size="xs"
              color="error"
              variant="soft"
              block
              icon="i-lucide-refresh-cw"
              @click="emit('runOne', item.id)"
            >
              Retry
            </UButton>
            <div
              v-else-if="item.status === 'done'"
              class="flex items-center justify-center gap-1 text-xs text-success py-0.5"
            >
              <UIcon
                name="i-lucide-check-circle"
                class="size-3.5"
              />
              <span>Done</span>
            </div>
            <div
              v-else-if="item.status === 'skipped'"
              class="text-center text-xs text-error py-0.5"
            >
              Exceeds 25MB
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
