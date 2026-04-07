<script setup>
defineProps({
  title: {
    type: String,
    default: 'Henüz içerik yok'
  },
  description: String,
  icon: {
    type: String,
    default: 'clipboard'
  }
})

const icons = {
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
      <svg class="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="icons[icon] || icons.clipboard" />
      </svg>
    </div>
    <h3 class="text-lg font-medium text-text mb-1">{{ title }}</h3>
    <p v-if="description" class="text-muted text-sm max-w-sm">{{ description }}</p>
    <slot />
  </div>
</template>
