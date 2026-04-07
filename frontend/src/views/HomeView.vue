<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projects'
import { useEntriesStore } from '../stores/entries'
import { useReportsStore } from '../stores/reports'
import AppHeader from '../components/layout/AppHeader.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import EmptyState from '../components/common/EmptyState.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const { t } = useI18n()
const router = useRouter()
const projectsStore = useProjectsStore()
const entriesStore = useEntriesStore()
const reportsStore = useReportsStore()

const loadingProject = ref(null)

async function selectProject(project) {
  loadingProject.value = project.id
  projectsStore.setCurrentProject(project)
  // Fetch stats for this project
  await entriesStore.fetchEntries(project.id)
  await reportsStore.fetchReports(project.id)
  router.push(`/project?projectId=${project.id}`)
  loadingProject.value = null
}

function createNewProject() {
  // Trigger the modal in sidebar by dispatching an event or just navigate
  // The sidebar has the new project modal, so we just need to trigger it
  document.querySelector('[data-new-project-btn]')?.click()
}
</script>

<template>
  <div class="flex flex-col h-full">
    <AppHeader
      :title="t('home.projects')"
      :subtitle="t('home.allProjects')"
    >
      <BaseButton @click="createNewProject">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ t('project.new') }}
      </BaseButton>
    </AppHeader>

    <div class="flex-1 overflow-auto p-6">
      <LoadingSpinner v-if="projectsStore.loading" />

      <EmptyState
        v-else-if="projectsStore.projects.length === 0"
        :title="t('sidebar.noProjects')"
        :description="t('home.createProject')"
      />

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="project in projectsStore.projects"
          :key="project.id"
          class="bg-surface border border-border rounded-xl p-6 hover:border-primary cursor-pointer transition-colors"
          :class="{ 'opacity-50': loadingProject === project.id }"
          @click="selectProject(project)"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-text truncate">{{ project.name }}</h3>
            <svg v-if="loadingProject === project.id" class="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p class="text-xs text-muted">
            {{ new Date(project.created_at).toLocaleDateString('tr-TR') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>