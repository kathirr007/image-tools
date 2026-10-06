<script setup lang="ts">
const job = useImageJob('/api/v1/convert')

function onSelect(f: File) {
  job.setFile(f)
}
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <div class="flex flex-col gap-4">
      <ImageUploader
        :preview-url="job.previewUrl.value"
        :file-name="job.file.value?.name ?? null"
        @select="onSelect"
      />
      <OptionsForm
        mode="convert"
        :disabled="!job.file.value || job.isProcessing.value"
        @run="job.submit"
      />
    </div>
    <div>
      <ResultCompare
        :result-url="job.resultUrl.value"
        :stats="job.stats.value"
        :original-size="job.originalSize.value"
        :processing="job.isProcessing.value"
      />
      <UAlert
        v-if="job.error.value"
        class="mt-4"
        color="error"
        variant="soft"
        icon="i-lucide-triangle-alert"
        :title="job.error.value"
      />
    </div>
  </div>
</template>
