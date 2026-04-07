<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({
  title: String,
  subtitle: String
})

const router = useRouter()
const route = useRoute()

const parentRoute = computed(() => {
  const path = route.path

  if (path === '/') return null
  if (path === '/project' || path.startsWith('/project?')) return { path: '/', label: 'Projeler' }

  if (path === '/timeline') return { path: '/project', label: 'Dashboard' }
  if (path === '/entries') return { path: '/project', label: 'Dashboard' }
  if (path === '/reports') return { path: '/project', label: 'Dashboard' }
  if (path.startsWith('/reports/')) return { path: '/reports', label: 'Raporlar' }
  if (path === '/settings') return { path: '/', label: 'Projeler' }

  return { path: '/', label: 'Projeler' }
})

function goUp() {
  if (parentRoute.value) {
    router.push(parentRoute.value.path)
  }
}
</script>

<template>
  <header class="h-14 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6">
    <div class="flex items-center gap-2 lg:gap-3 min-w-0">
      <button
        v-if="parentRoute"
        class="p-1.5 text-muted hover:text-text hover:bg-border rounded-lg transition-colors shrink-0"
        @click="goUp"
      >
        <svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <nav v-if="parentRoute" class="flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm min-w-0">
        <router-link
          :to="parentRoute.path"
          class="text-muted hover:text-primary transition-colors truncate"
        >
          {{ parentRoute.label }}
        </router-link>
        <span class="text-muted shrink-0">/</span>
        <span class="text-text font-medium truncate">{{ title }}</span>
      </nav>
      <div v-else class="min-w-0">
        <h2 class="text-base lg:text-lg font-semibold text-text truncate">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-muted hidden lg:block">{{ subtitle }}</p>
      </div>
    </div>
    <div class="shrink-0 ml-2 flex flex-wrap gap-1 justify-end max-w-[60%]">
      <slot />
    </div>
  </header>
</template>
