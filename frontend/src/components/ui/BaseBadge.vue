<script setup>
defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'done', 'in_progress', 'todo', 'deadlines', 'working', 'completed', 'planning', 'risks_blockers'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md'].includes(v)
  }
})

const variantClasses = {
  default: 'bg-surface text-muted border-border',
  done: 'bg-done/10 text-done border-done/30',
  'in_progress': 'bg-primary/10 text-primary border-primary/30',
  'todo': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  'deadlines': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  'working': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  'completed': 'bg-emerald-600/10 text-emerald-600 border-emerald-600/30',
  'planning': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  'risks_blockers': 'bg-red-500/10 text-red-600 border-red-500/30'
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-medium rounded-md border',
      variantClasses[variant],
      size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
    ]"
  >
    <slot />
  </span>
</template>
