<script setup lang="ts">
import type { ToolOptions } from '~/composables/useImageJob'

const batch = useImageBatch('/api/v1/convert')

const currentOptions = ref<ToolOptions>({
  format: 'webp',
  quality: 90,
  width: undefined,
  height: undefined,
  fit: 'inside',
  stripMetadata: true,
  lossless: false
})

const runLabel = computed(() => {
  const n = batch.processableCount.value
  return n > 0 ? `Convert all (${n} image${n > 1 ? 's' : ''})` : 'Convert all images'
})

function onRunAll(opts: ToolOptions) {
  currentOptions.value = opts
  batch.submitAll(opts)
}

function onRunOne(id: number) {
  batch.submitOne(id, currentOptions.value)
}
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <div class="flex flex-col gap-4">
      <ImageUploader
        :items="batch.items.value"
        mode="convert"
        @select="batch.addFiles"
        @remove="batch.removeItem"
        @clear="batch.clear"
        @run-one="onRunOne"
      />
      <OptionsForm
        mode="convert"
        :disabled="batch.processableCount.value === 0 || batch.running.value"
        :run-label="runLabel"
        @change="(opts) => currentOptions = opts"
        @run="onRunAll"
      />
    </div>
    <div>
      <BatchResults
        :items="batch.items.value"
        :running="batch.running.value"
        :done="batch.summary.value.done"
        :total="batch.summary.value.total"
        :total-saved="batch.summary.value.savings"
        @retry="onRunOne"
      />
      <UAlert
        v-if="batch.limitWarning.value"
        class="mt-4"
        color="warning"
        variant="soft"
        icon="i-lucide-triangle-alert"
        :title="batch.limitWarning.value"
      />
    </div>
  </div>
</template>
