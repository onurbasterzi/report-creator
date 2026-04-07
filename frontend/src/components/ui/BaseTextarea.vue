<script setup>
defineProps({
  modelValue: [String, Number],
  placeholder: String,
  disabled: Boolean,
  error: String,
  label: String,
  id: String,
  rows: {
    type: Number,
    default: 3
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-muted mb-1.5">
      {{ label }}
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :class="[
        'w-full bg-surface border rounded-lg px-3 py-2 text-text placeholder-muted transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none',
        error ? 'border-blocked focus:border-blocked' : 'border-border focus:border-primary'
      ]"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="mt-1 text-xs text-blocked">{{ error }}</p>
  </div>
</template>
