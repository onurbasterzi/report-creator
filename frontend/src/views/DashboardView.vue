<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import AppSidebar from '../components/layout/AppSidebar.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const router = useRouter()
const route = useRoute()
const projectsStore = useProjectsStore()
const sidebarOpen = ref(false)

onMounted(async () => {
  await projectsStore.fetchProjects()
})

// When project changes, navigate to project dashboard
watch(() => projectsStore.currentProject, (project) => {
  if (project && route.path === '/') {
    router.push('/project')
  }
})

// When user navigates to root, ensure project is deselected
watch(() => route.path, (path) => {
  if (path === '/') {
    projectsStore.setCurrentProject(null)
  }
})

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="flex h-screen bg-background overflow-hidden">
    <!-- Mobile header with menu button -->
    <header class="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-30 flex items-center px-4">
      <button
        class="p-2 -ml-2 text-muted hover:text-text"
        @click="toggleSidebar"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span class="ml-3 font-semibold text-text">Rapor Oluşturucu</span>
    </header>

    <!-- Sidebar overlay for mobile -->
    <div
      v-if="sidebarOpen"
      class="lg:hidden fixed inset-0 z-40"
      @click="sidebarOpen = false"
    >
      <div class="absolute inset-0 bg-black/50" />
      <AppSidebar
        class="relative z-50 h-full"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        hide-header
      />
    </div>

    <!-- Desktop sidebar -->
    <AppSidebar class="hidden lg:block shrink-0" />

    <!-- Main content -->
    <main class="flex-1 overflow-auto h-full pt-14 lg:pt-0">
      <LoadingSpinner v-if="projectsStore.loading" class="h-full" text="Yükleniyor..." />
      <RouterView v-else />
    </main>
  </div>
</template>