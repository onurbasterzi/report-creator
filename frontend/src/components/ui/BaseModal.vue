<script setup>
import { watch } from 'vue'

const props = defineProps({
  show: Boolean,
  title: String,
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})

const emit = defineEmits(['close'])

watch(() => props.show, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="emit('close')"
        />
        <div
          :class="[
            'relative bg-surface border border-border rounded-xl shadow-2xl w-full',
            { 'max-w-sm': size === 'sm', 'max-w-md': size === 'md', 'max-w-lg': size === 'lg' }
          ]"
          style="max-height: 90vh; display: flex; flex-direction: column;"
        >
          <div class="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 class="text-lg font-semibold text-text">{{ title }}</h3>
            <button
              class="p-1 text-muted hover:text-text transition-colors rounded-lg hover:bg-border"
              @click="emit('close')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div class="p-4">
              <slot />
            </div>
          </div>
          <div v-if="$slots.footer" class="shrink-0 px-4 py-3 border-t border-border">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
