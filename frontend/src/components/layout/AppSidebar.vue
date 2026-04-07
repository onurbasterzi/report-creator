<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { useProjectsStore } from '../../stores/projects'
import BaseButton from '../ui/BaseButton.vue'
import BaseModal from '../ui/BaseModal.vue'
import BaseInput from '../ui/BaseInput.vue'
import ConfirmModal from '../common/ConfirmModal.vue'

defineProps({
  hideHeader: {
    type: Boolean,
    default: false
  }
})

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()

const showNewProjectModal = ref(false)
const newProjectName = ref('')
const editingProject = ref(null)
const deletingProject = ref(null)
const isDarkMode = ref(localStorage.getItem('theme') !== 'light')

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDarkMode.value)
}

const languages = ['tr', 'en', 'it']

function toggleLanguage() {
  const currentIndex = languages.indexOf(locale.value)
  const nextIndex = (currentIndex + 1) % languages.length
  locale.value = languages[nextIndex]
  localStorage.setItem('locale', languages[nextIndex])
}

const navItems = [
  { path: '/', icon: 'home', labelKey: 'nav.home' },
  { path: '/settings', icon: 'cog', labelKey: 'nav.settings' }
]

const icons = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
}

async function createProject() {
  if (!newProjectName.value.trim()) return
  const project = await projectsStore.createProject(newProjectName.value.trim())
  if (project) {
    newProjectName.value = ''
    showNewProjectModal.value = false
    // Don't auto-select, just go to home
    router.push('/')
  }
}

function selectProject(project) {
  projectsStore.setCurrentProject(project)
  router.push(`/project?projectId=${project.id}`)
}

function goHome() {
  projectsStore.setCurrentProject(null)
  router.push('/')
}

function logout() {
  authStore.logout()
  router.push('/login')
}

function openEditProject(project, event) {
  event.stopPropagation()
  editingProject.value = { ...project }
}

function confirmDeleteProject(project, event) {
  event.stopPropagation()
  deletingProject.value = project
}

async function handleDeleteProject() {
  if (deletingProject.value) {
    await projectsStore.deleteProject(deletingProject.value.id)
    deletingProject.value = null
  }
}

async function handleUpdateProject() {
  if (editingProject.value && editingProject.value.name.trim()) {
    await projectsStore.updateProject(editingProject.value.id, editingProject.value.name.trim())
    editingProject.value = null
  }
}
</script>

<template>
  <div>
  <aside class="w-60 h-screen bg-surface border-r border-border flex flex-col shrink-0">
    <!-- Logo -->
    <div v-if="!hideHeader" class="p-4 border-b border-border">

      <button
        class="text-lg font-bold text-text flex items-center gap-2 hover:opacity-80 transition-opacity w-full"
        @click="goHome"
      >
        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {{ t('app.name') }}
      </button>
    </div>

    <!-- Current Project -->
    <div v-if="projectsStore.currentProject" class="p-3 border-b border-border">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-muted uppercase tracking-wider">{{ t('sidebar.selectedProject') }}</span>
        <button
          class="p-1 text-muted hover:text-text hover:bg-border rounded transition-colors"
          :title="t('sidebar.closeProject')"
          @click="goHome"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="bg-primary/10 rounded-lg p-3">
        <p class="text-sm font-medium text-primary truncate">{{ projectsStore.currentProject.name }}</p>
        <div class="flex gap-2 mt-2">
          <router-link
            :to="`/timeline?projectId=${projectsStore.currentProject.id}`"
            class="text-xs text-muted hover:text-primary"
          >
            {{ t('sidebar.timeline') }}
          </router-link>
          <span class="text-muted">•</span>
          <router-link
            :to="`/entries?projectId=${projectsStore.currentProject.id}`"
            class="text-xs text-muted hover:text-primary"
          >
            {{ t('sidebar.tasks') }}
          </router-link>
          <span class="text-muted">•</span>
          <router-link
            :to="`/reports?projectId=${projectsStore.currentProject.id}`"
            class="text-xs text-muted hover:text-primary"
          >
            {{ t('sidebar.reports') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Projects -->
    <div class="flex-1 overflow-y-auto p-3">
      <div class="flex items-center justify-between mb-2 px-2">
        <span class="text-xs font-medium text-muted uppercase tracking-wider">{{ t('sidebar.projects') }}</span>
        <button
          data-new-project-btn
          class="p-1 text-muted hover:text-text hover:bg-border rounded transition-colors"
          @click="showNewProjectModal = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div class="space-y-1">
        <div
          v-for="project in projectsStore.projects"
          :key="project.id"
          :class="[
            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group flex items-center justify-between',
            projectsStore.currentProject?.id === project.id
              ? 'bg-primary/20 text-primary'
              : 'text-muted hover:text-text hover:bg-border'
          ]"
        >
          <span
            class="truncate cursor-pointer flex-1"
            @click="selectProject(project)"
          >
            {{ project.name }}
          </span>
          <div class="hidden group-hover:flex items-center gap-1">
            <button
              class="p-1 hover:bg-border rounded"
              title="Düzenle"
              @click="openEditProject(project, $event)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              class="p-1 hover:bg-border rounded text-blocked"
              title="Sil"
              @click="confirmDeleteProject(project, $event)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <p v-if="projectsStore.projects.length === 0" class="text-xs text-muted px-3 py-2">
        {{ t('sidebar.noProjects') }}
      </p>
    </div>

    <!-- Navigation -->
    <nav class="p-3 border-t border-border space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          route.path === item.path
            ? 'bg-primary/20 text-primary'
            : 'text-muted hover:text-text hover:bg-border'
        ]"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icons[item.icon]" />
        </svg>
        {{ t(item.labelKey) }}
      </router-link>

      <!-- Theme Toggle -->
      <button
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted hover:text-text hover:bg-border"
        @click="toggleTheme"
      >
        <svg v-if="isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        {{ isDarkMode ? t('sidebar.lightTheme') : t('sidebar.darkTheme') }}
      </button>

      <!-- Language Toggle -->
      <button
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted hover:text-text hover:bg-border"
        @click="toggleLanguage"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        {{ locale === 'tr' ? t('sidebar.english') : locale === 'en' ? t('sidebar.italian') : t('sidebar.turkish') }}
      </button>
    </nav>

    <!-- Logout -->
    <div class="p-3 border-t border-border">
      <BaseButton variant="ghost" class="w-full justify-start" @click="logout">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {{ t('sidebar.logout') }}
      </BaseButton>
    </div>
  </aside>

  <!-- New Project Modal -->
  <BaseModal :show="showNewProjectModal" :title="t('project.new')" @close="showNewProjectModal = false">
    <form @submit.prevent="createProject">
      <BaseInput
        v-model="newProjectName"
        :label="t('project.name')"
        :placeholder="t('project.namePlaceholder')"
      />
      <div class="flex justify-end gap-3 mt-6">
        <BaseButton variant="ghost" type="button" @click="showNewProjectModal = false">
          {{ t('project.cancel') }}
        </BaseButton>
        <BaseButton type="submit" :disabled="!newProjectName.trim()">
          {{ t('project.create') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>

  <!-- Edit Project Modal -->
  <BaseModal :show="!!editingProject" :title="t('project.edit')" @close="editingProject = null">
    <form v-if="editingProject" @submit.prevent="handleUpdateProject">
      <BaseInput
        v-model="editingProject.name"
        :label="t('project.name')"
        :placeholder="t('project.namePlaceholder')"
      />
      <div class="flex justify-end gap-3 mt-6">
        <BaseButton variant="ghost" type="button" @click="editingProject = null">
          {{ t('project.cancel') }}
        </BaseButton>
        <BaseButton type="submit" :disabled="!editingProject.name.trim()">
          {{ t('project.save') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>

  <!-- Delete Project Confirmation -->
  <ConfirmModal
    :show="!!deletingProject"
    :title="t('project.delete')"
    :message="t('project.deleteConfirm', { name: deletingProject?.name })"
    :confirm-text="t('project.delete')"
    @confirm="handleDeleteProject"
    @cancel="deletingProject = null"
  />
  </div>
</template>
