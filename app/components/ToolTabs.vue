<script setup lang="ts">
const links = [
  { label: 'Optimize', to: '/optimize', icon: 'i-lucide-zap' },
  { label: 'Convert', to: '/convert', icon: 'i-lucide-repeat' }
]
</script>

<template>
  <nav class="flex gap-2">
    <UButton
      v-for="l in links"
      :key="l.to"
      :to="l.to"
      :icon="l.icon"
      color="neutral"
      variant="soft"
      active-variant="solid"
      size="sm"
    >
      {{ l.label }}
    </UButton>
  </nav>
</template>
