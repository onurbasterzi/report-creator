<script setup>
import { watch, computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projects'
import { useEntriesStore } from '../stores/entries'
import AppHeader from '../components/layout/AppHeader.vue'
import CategoryBadge from '../components/common/CategoryBadge.vue'
import EmptyState from '../components/common/EmptyState.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const { t } = useI18n()
const route = useRoute()
const projectsStore = useProjectsStore()
const entriesStore = useEntriesStore()

const viewMode = ref('list')

const sortedEntries = computed(() => {
  return [...entriesStore.entries].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    if (dateCompare !== 0) return dateCompare
    return new Date(b.created_at) - new Date(a.created_at)
  })
})

onMounted(async () => {
  const projectId = route.query.projectId
  if (projectId) {
    const project = projectsStore.projects.find(p => p.id === Number(projectId))
    if (project) {
      projectsStore.setCurrentProject(project)
    }
  }
})

watch(
  () => route.query.projectId,
  async (newProjectId) => {
    if (newProjectId) {
      const project = projectsStore.projects.find(p => p.id === Number(newProjectId))
      if (project) {
        projectsStore.setCurrentProject(project)
      }
    }
  }
)

watch(
  () => projectsStore.currentProject,
  async (project) => {
    if (project) {
      await entriesStore.fetchEntries(project.id)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex flex-col h-full">
    <AppHeader
      :title="t('timeline.title')"
      :subtitle="projectsStore.currentProject?.name"
    />

    <div class="flex-1 overflow-auto p-6">
      <template v-if="projectsStore.currentProject">
        <LoadingSpinner v-if="entriesStore.loading" />

        <EmptyState
          v-else-if="entriesStore.entries.length === 0"
          :title="t('entries.noEntries')"
          :description="t('timeline.addTasks')"
        />

        <div v-else>
          <!-- View Toggle -->
          <div class="flex justify-end mb-4">
            <div class="flex gap-1 bg-surface border border-border rounded-lg p-1">
              <button
                :class="['p-2 rounded', viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-text']"
                @click="viewMode = 'list'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                :class="['p-2 rounded', viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-text']"
                @click="viewMode = 'grid'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Grid View -->
          <div
            v-if="viewMode === 'grid'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="entry in sortedEntries"
              :key="entry.id"
              class="bg-surface border border-border rounded-xl p-4 hover:border-primary transition-colors"
            >
              <div class="flex items-center gap-2 mb-3">
                <div
                  :class="[
                    'w-3 h-3 rounded-full',
                    {
                      'bg-done': entry.category === 'done',
                      'bg-primary': entry.category === 'in_progress',
                      'bg-yellow-500': entry.category === 'todo',
                      'bg-purple-500': entry.category === 'deadlines',
                      'bg-cyan-500': entry.category === 'working',
                      'bg-emerald-600': entry.category === 'completed',
                      'bg-orange-500': entry.category === 'planning',
                      'bg-red-500': entry.category === 'risks_blockers'
                    }
                  ]"
                />
                <span class="text-xs text-muted">{{ entry.date }}</span>
                <CategoryBadge :category="entry.category" />
              </div>
              <p class="text-sm text-text whitespace-pre-wrap">{{ entry.description }}</p>
            </div>
          </div>

          <!-- List View (Timeline) -->
          <div v-else class="relative">
            <!-- Vertical line - centered -->
            <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border transform -translate-x-1/2" />

            <div class="space-y-6">
              <div
                v-for="(entry, index) in sortedEntries"
                :key="entry.id"
                class="relative"
              >
                <!-- Dot on timeline - centered on line -->
                <div
                  :class="[
                    'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background z-10',
                    {
                      'bg-done': entry.category === 'done',
                      'bg-primary': entry.category === 'in_progress',
                      'bg-yellow-500': entry.category === 'todo',
                      'bg-purple-500': entry.category === 'deadlines',
                      'bg-cyan-500': entry.category === 'working',
                      'bg-emerald-600': entry.category === 'completed',
                      'bg-orange-500': entry.category === 'planning',
                      'bg-red-500': entry.category === 'risks_blockers'
                    }
                  ]"
                />

                <!-- Card - alternating left and right -->
                <div
                  :class="[
                    'bg-surface border border-border rounded-xl p-4 w-[calc(50%-2rem)]',
                    index % 2 === 0 ? 'mr-auto pr-8' : 'ml-auto pl-8'
                  ]"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs text-muted">{{ entry.date }}</span>
                    <CategoryBadge :category="entry.category" />
                  </div>
                  <p class="text-sm text-text whitespace-pre-wrap">{{ entry.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <EmptyState
        v-else
        :title="t('entries.noProjectSelected')"
        :description="t('timeline.selectProject')"
      />
    </div>
  </div>
</template>
