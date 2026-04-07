<script setup>
defineProps({
  modelValue: [String, Number],
  options: {
    type: Array,
    required: true
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
    <div class="relative">
      <select
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :class="[
          'w-full bg-surface border rounded-lg px-3 py-2 pr-10 text-text text-sm transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer',
          error ? 'border-blocked focus:border-blocked' : 'border-border focus:border-primary'
        ]"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    <p v-if="error" class="mt-1 text-xs text-blocked">{{ error }}</p>
  </div>
</template>
