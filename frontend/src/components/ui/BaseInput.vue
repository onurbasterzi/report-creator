<script setup>
defineProps({
  modelValue: [String, Number],
  type: {
    type: String,
    default: 'text'
  },
  placeholder: String,
  disabled: Boolean,
  error: String,
  label: String,
  id: String
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-muted mb-1.5">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'w-full bg-surface border rounded-lg px-3 py-2 text-text placeholder-muted transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-blocked focus:border-blocked' : 'border-border focus:border-primary'
      ]"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="mt-1 text-xs text-blocked">{{ error }}</p>
  </div>
</template>
