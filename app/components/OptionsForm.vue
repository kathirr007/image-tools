<script setup lang="ts">
import type { ToolOptions } from '~/composables/useImageJob'

const props = defineProps<{
  mode: 'optimize' | 'convert'
  disabled: boolean
}>()
const emit = defineEmits<{ (e: 'run', opts: ToolOptions): void }>()

const formats = props.mode === 'convert'
  ? [
      { label: 'JPEG (.jpg)', value: 'jpeg' },
      { label: 'PNG (.png)', value: 'png' },
      { label: 'WebP (.webp)', value: 'webp' },
      { label: 'AVIF (.avif)', value: 'avif' }
    ]
  : [
      { label: 'Keep original', value: 'original' },
      { label: 'JPEG (.jpg)', value: 'jpeg' },
      { label: 'PNG (.png)', value: 'png' },
      { label: 'WebP (.webp)', value: 'webp' },
      { label: 'AVIF (.avif)', value: 'avif' }
    ]

const fits = [
  { label: 'Inside (fit within box)', value: 'inside' },
  { label: 'Cover (fill + crop)', value: 'cover' },
  { label: 'Contain (letterbox)', value: 'contain' },
  { label: 'Fill (stretch)', value: 'fill' }
]

const opts = reactive<ToolOptions>({
  format: props.mode === 'convert' ? 'webp' : 'original',
  quality: props.mode === 'convert' ? 90 : 80,
  width: undefined,
  height: undefined,
  fit: 'inside',
  stripMetadata: true,
  lossless: false
})

const showQuality = computed(() => !['png'].includes(opts.format) || !opts.lossless)
</script>

<template>
  <UCard>
    <template #header>
      <span class="font-semibold">2 · {{ mode === 'optimize' ? 'Optimization' : 'Conversion' }} options</span>
    </template>
    <div class="flex flex-col gap-4">
      <UFormField label="Output format" name="format">
        <USelect v-model="opts.format" :items="formats" value-key="value" class="w-full" />
      </UFormField>

      <UFormField :label="`Quality: ${opts.quality}`" name="quality" :hint="showQuality ? '' : 'PNG lossless ignores quality'">
        <input v-model.number="opts.quality" type="range" min="10" max="100" class="w-full accent-primary" :disabled="!showQuality">
      </UFormField>

      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Max width (px)" hint="≤ 4000">
          <UInput v-model="opts.width" type="number" min="1" max="4000" placeholder="e.g. 1920" />
        </UFormField>
        <UFormField label="Max height (px)" hint="≤ 4000">
          <UInput v-model="opts.height" type="number" min="1" max="4000" placeholder="e.g. 1080" />
        </UFormField>
      </div>

      <UFormField label="Resize fit">
        <USelect v-model="opts.fit" :items="fits" value-key="value" class="w-full" />
      </UFormField>

      <div class="flex flex-col gap-2">
        <USwitch v-model="opts.stripMetadata" label="Strip metadata (smaller + private)" />
        <USwitch v-model="opts.lossless" label="Lossless (PNG/WebP/AVIF)" />
      </div>

      <UButton
        icon="i-lucide-sparkles"
        size="lg"
        block
        :disabled="disabled"
        :label="mode === 'optimize' ? 'Optimize image' : 'Convert image'"
        @click="emit('run', { ...opts })"
      />
      <p class="text-xs text-muted">
        Tip: WebP at 80% is a safe default. AVIF is smaller but slower (10s serverless timeout).
      </p>
    </div>
  </UCard>
</template>
