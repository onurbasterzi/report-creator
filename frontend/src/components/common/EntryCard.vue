<script setup>
import CategoryBadge from './CategoryBadge.vue'
import BaseButton from '../ui/BaseButton.vue'

defineProps({
  entry: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])

const borderColors = {
  'done': 'border-l-done',
  'in_progress': 'border-l-primary',
  'todo': 'border-l-yellow-500',
  'deadlines': 'border-l-purple-500',
  'working': 'border-l-cyan-500',
  'completed': 'border-l-emerald-600',
  'planning': 'border-l-orange-500',
  'risks_blockers': 'border-l-red-500'
}
</script>

<template>
  <div
    :class="[
      'bg-surface border border-border rounded-xl p-4 border-l-4 transition-all duration-150 hover:brightness-110 group',
      borderColors[entry.category] || 'border-l-border'
    ]"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <p class="text-text text-sm leading-relaxed whitespace-pre-wrap">{{ entry.description }}</p>
        <p class="text-muted text-xs mt-2">{{ entry.date }}</p>
      </div>
      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CategoryBadge :category="entry.category" />
        <BaseButton size="sm" variant="ghost" @click.stop="$emit('edit', entry)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </BaseButton>
        <BaseButton size="sm" variant="ghost" @click.stop="$emit('delete', entry)">
          <svg class="w-4 h-4 text-blocked" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
