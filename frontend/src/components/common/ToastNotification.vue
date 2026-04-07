<script setup>
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const iconPaths = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}

const typeClasses = {
  success: 'bg-done border-done/30 text-done',
  error: 'bg-blocked border-blocked/30 text-blocked',
  info: 'bg-primary border-primary/30 text-primary'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm min-w-[280px] max-w-[400px]',
            typeClasses[toast.type] || typeClasses.info
          ]"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPaths[toast.type] || iconPaths.info" />
          </svg>
          <span class="flex-1 text-sm text-text">{{ toast.message }}</span>
          <button
            class="p-1 hover:opacity-70 transition-opacity"
            @click="toastStore.remove(toast.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
