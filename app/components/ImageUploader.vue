<script setup lang="ts">
const props = defineProps<{
  previewUrl: string | null
  fileName: string | null
}>()
const emit = defineEmits<{ (e: 'select', f: File): void }>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDrag = ref(false)

function onFiles(files: FileList | File[] | null) {
  const f = files?.[0]
  if (f)
    emit('select', f)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDrag.value = false
  onFiles(e.dataTransfer?.files ?? null)
}
</script>

<template>
  <UCard>
    <template #header>
      <span class="font-semibold">1 · Upload image</span>
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
        Drag & drop or <span class="text-primary underline">click to browse</span>
      </p>
      <p class="text-xs text-muted mt-1">
        JPG · PNG · WebP · AVIF · TIFF — max 25MB, 8000px
      </p>
      <input
        ref="inputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
        class="hidden"
        @change="onFiles(($event.target as HTMLInputElement).files)"
      >
    </div>
    <div
      v-if="previewUrl"
      class="mt-4"
    >
      <img
        :src="previewUrl"
        alt="original preview"
        class="max-h-64 mx-auto rounded-lg object-contain"
      >
      <p class="text-xs text-muted text-center mt-2 truncate">
        {{ props.fileName }}
      </p>
    </div>
  </UCard>
</template>
