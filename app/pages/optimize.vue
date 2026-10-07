<script setup lang="ts">
const batch = useImageBatch('/api/v1/optimize')

const runLabel = computed(() => {
  const n = batch.processableCount.value
  return n > 0 ? `Optimize ${n} image${n > 1 ? 's' : ''}` : 'Optimize images'
})
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <div class="flex flex-col gap-4">
      <ImageUploader
        :items="batch.items.value"
        @select="batch.addFiles"
        @remove="batch.removeItem"
        @clear="batch.clear"
      />
      <OptionsForm
        mode="optimize"
        :disabled="batch.processableCount.value === 0 || batch.running.value"
        :run-label="runLabel"
        @run="batch.submitAll"
      />
    </div>
    <div>
      <BatchResults
        :items="batch.items.value"
        :running="batch.running.value"
        :done="batch.summary.value.done"
        :total="batch.summary.value.total"
        :total-saved="batch.summary.value.savings"
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
