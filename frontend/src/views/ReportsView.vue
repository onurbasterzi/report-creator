<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projects'
import { useEntriesStore } from '../stores/entries'
import { useReportsStore } from '../stores/reports'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { useToastStore } from '../stores/toast'
import AppHeader from '../components/layout/AppHeader.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import CategoryBadge from '../components/common/CategoryBadge.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'
import EmptyState from '../components/common/EmptyState.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const projectsStore = useProjectsStore()
const entriesStore = useEntriesStore()
const reportsStore = useReportsStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const viewMode = ref('grid')
const reports = ref([])
const loading = ref(false)
const generating = ref(false)
const showSelectModal = ref(false)
const selectedEntryIds = ref([])
const deletingReport = ref(null)
const selectedProvider = ref('')
const selectedLanguage = ref('en')
const reportMode = ref('structured')
const freeTextInput = ref('')

const API_URL = '/api'

const reportEligibleCategories = ['deadlines', 'working', 'completed', 'planning', 'risks_blockers']

// Structured mode: sadece rapor-eligible kategoriler
const sortedEntries = computed(() => {
  return [...entriesStore.entries]
    .filter(e => reportEligibleCategories.includes(e.category))
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return new Date(b.created_at) - new Date(a.created_at)
    })
})

// Free mode: tüm kategoriler
const allEntries = computed(() => {
  return [...entriesStore.entries]
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return new Date(b.created_at) - new Date(a.created_at)
    })
})

// Modal'da gösterilecek entries (mode'a göre)
const modalEntries = computed(() => {
  if (reportMode.value === 'free') {
    return allEntries.value
  }
  return sortedEntries.value
})

const providerOptions = computed(() => {
  if (settingsStore.settings.availableProviders?.length > 0) {
    return settingsStore.settings.availableProviders.map(p => ({
      value: p.id,
      label: p.name
    }))
  }
  return [
    { value: 'gemini', label: 'Google Gemini (API)' },
    { value: 'gemini_cli', label: 'Gemini CLI' },
    { value: 'minimax', label: 'MiniMax' }
  ]
})

const geminiApiModels = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' }
]

const geminiCliModels = [
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' }
]

const minimaxModels = [
  { value: 'MiniMax-M2.7', label: 'MiniMax M2.7' },
  { value: 'MiniMax-M2.5', label: 'MiniMax M2.5' },
  { value: 'MiniMax-M2.1', label: 'MiniMax M2.1' }
]

const modelOptions = computed(() => {
  if (selectedProvider.value === 'minimax') return minimaxModels
  if (selectedProvider.value === 'gemini_cli') return geminiCliModels
  return geminiApiModels
})

const selectedModel = ref('gemini-3.1-flash-lite-preview')

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' }
]

async function fetchReports() {
  if (!projectsStore.currentProject) return

  loading.value = true
  try {
    const res = await fetch(`${API_URL}/projects/${projectsStore.currentProject.id}/reports`, {
      headers: authStore.getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    reports.value = data
  } catch (err) {
    toastStore.show(err.message, 'error')
  } finally {
    loading.value = false
  }
}

function openGenerateModal() {
  const currentProvider = settingsStore.settings.provider
  const hasApiKey = settingsStore.settings.geminiApiKey || settingsStore.settings.minimaxApiKey
  const needsKey = currentProvider && currentProvider !== 'gemini_cli'
  if (needsKey && !hasApiKey) {
    toastStore.show('AI API anahtarı tanımlanmamış. Ayarlardan ekleyin.', 'error')
    router.push('/settings')
    return
  }
  // Free text mode doesn't need entries
  if (reportMode.value !== 'freeText') {
    if (modalEntries.value.length === 0) {
      toastStore.show('Rapor oluşturmak için task olmalı.', 'error')
      return
    }
    // Select all by default
    selectedEntryIds.value = modalEntries.value.map(e => e.id)
  }
  // Set defaults
  selectedProvider.value = settingsStore.settings.provider || 'gemini'
  selectedLanguage.value = 'en'
  freeTextInput.value = ''
  showSelectModal.value = true
}

function toggleEntry(entryId) {
  const index = selectedEntryIds.value.indexOf(entryId)
  if (index === -1) {
    selectedEntryIds.value.push(entryId)
  } else {
    selectedEntryIds.value.splice(index, 1)
  }
}

function selectAll() {
  selectedEntryIds.value = modalEntries.value.map(e => e.id)
}

function selectNone() {
  selectedEntryIds.value = []
}

async function generateReport() {
  if (reportMode.value === 'freeText') {
    if (!freeTextInput.value.trim()) {
      toastStore.show('Rapor metni boş olamaz.', 'error')
      return
    }
  } else {
    if (selectedEntryIds.value.length === 0) {
      toastStore.show('En az bir task seçmelisiniz.', 'error')
      return
    }
  }

  showSelectModal.value = false
  generating.value = true
  try {
    const res = await fetch(`${API_URL}/projects/${projectsStore.currentProject.id}/reports`, {
      method: 'POST',
      headers: authStore.getHeaders(),
      body: JSON.stringify({
        entryIds: selectedEntryIds.value,
        provider: selectedProvider.value,
        model: selectedModel.value,
        language: selectedLanguage.value,
        mode: reportMode.value,
        freeText: freeTextInput.value
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || data.message || 'Rapor oluşturulamadı')
    toastStore.show('Rapor oluşturuldu', 'success')
    router.push(`/reports/${data.id}`)
  } catch (err) {
    toastStore.show(err.message, 'error')
  } finally {
    generating.value = false
  }
}

function viewReport(id) {
  router.push(`/reports/${id}`)
}

async function handleDeleteReport() {
  if (deletingReport.value) {
    await reportsStore.deleteReport(deletingReport.value.id)
    deletingReport.value = null
    await fetchReports()
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await settingsStore.fetchSettings()

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
      await fetchReports()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex flex-col h-full">
    <AppHeader
      :title="t('reports.title')"
      :subtitle="projectsStore.currentProject?.name"
    >
      <BaseButton
        v-if="projectsStore.currentProject"
        :loading="generating"
        @click="openGenerateModal"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ t('reports.generate') }}
      </BaseButton>
    </AppHeader>

    <div class="flex-1 overflow-auto p-6">
      <template v-if="projectsStore.currentProject">
        <LoadingSpinner v-if="loading" />

        <EmptyState
          v-else-if="reports.length === 0"
          :title="t('reports.noReports')"
          :description="t('reports.createAi')"
        >
          <BaseButton
            v-if="sortedEntries.length > 0"
            class="mt-4"
            @click="openGenerateModal"
          >
            {{ t('reports.generate') }}
          </BaseButton>
        </EmptyState>

        <div v-else class="space-y-8">
          <!-- Generate new report section -->
          <div v-if="sortedEntries.length > 0" class="bg-surface border border-border rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-text">{{ t('reports.generateNew') }}</h3>
                <p class="text-xs text-muted mt-1">{{ sortedEntries.length }} {{ t('reports.tasksSelected') }}</p>
              </div>
              <BaseButton size="sm" @click="openGenerateModal">
                {{ t('reports.generate') }}
              </BaseButton>
            </div>
          </div>

          <!-- Reports list -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-muted">{{ t('reports.pastReports') }}</h3>
              <div class="flex gap-1 bg-surface border border-border rounded-lg p-1">
                <button
                  :class="['p-2 rounded', viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-text']"
                  @click="viewMode = 'grid'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  :class="['p-2 rounded', viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-text']"
                  @click="viewMode = 'list'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div :class="viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4' : 'space-y-3'">
              <div
                v-for="report in reports"
                :key="report.id"
                class="bg-surface border border-border rounded-xl p-4 hover:border-primary cursor-pointer transition-colors relative group"
                @click="viewReport(report.id)"
              >
                <p class="text-sm text-text whitespace-pre-wrap break-words">
                  {{ report.content ? report.content.substring(0, 300) : t('reports.reportContent') }}
                </p>
                <div class="mt-3 pt-3 border-t border-border">
                  <span class="text-xs text-muted">{{ formatDate(report.generated_at) }}</span>
                </div>
                <button
                  class="absolute top-2 right-2 p-1.5 bg-surface border border-border rounded-lg opacity-0 group-hover:opacity-100 hover:bg-blocked/10 hover:border-blocked hover:text-blocked transition-all"
                  :title="t('project.delete')"
                  @click.stop="deletingReport = report"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <EmptyState
        v-else
        :title="t('entries.noProjectSelected')"
        :description="t('entries.selectProject')"
      />
    </div>

    <!-- Entry Selection Modal -->
    <BaseModal
      :show="showSelectModal"
      :title="t('reports.generate')"
      size="lg"
      @close="showSelectModal = false"
    >
      <div class="space-y-4">
        <!-- AI Provider & Model Selection -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseSelect
            v-model="selectedProvider"
            :options="providerOptions"
            :label="t('settings.aiProvider')"
          />
          <BaseSelect
            v-model="selectedModel"
            :options="modelOptions"
            :label="t('reports.model')"
          />
          <BaseSelect
            v-model="selectedLanguage"
            :options="languageOptions"
            :label="t('reports.reportLanguage')"
          />
        </div>

        <!-- Mode Selection -->
        <div>
          <label class="text-sm font-medium text-muted mb-2 block">Rapor Modu</label>
          <div class="flex gap-2">
            <button
              :class="['px-4 py-2 rounded-lg border text-sm', reportMode === 'structured' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:border-muted']"
              @click="reportMode = 'structured'"
            >
              Yapılandırılmış
            </button>
            <button
              :class="['px-4 py-2 rounded-lg border text-sm', reportMode === 'free' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:border-muted']"
              @click="reportMode = 'free'"
            >
              Serbest
            </button>
            <button
              :class="['px-4 py-2 rounded-lg border text-sm', reportMode === 'freeText' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:border-muted']"
              @click="reportMode = 'freeText'"
            >
              Metin
            </button>
          </div>
        </div>

        <!-- Free Text Mode -->
        <div v-if="reportMode === 'freeText'">
          <label class="text-sm font-medium text-muted mb-2 block">Rapor İçeriği</label>
          <textarea
            v-model="freeTextInput"
            rows="8"
            class="w-full bg-surface border border-border rounded-lg p-3 text-text resize-none"
            placeholder="Rapor için notlarınızı veya taslak içeriğinizi buraya yazın..."
          />
        </div>

        <!-- Task Selection (Structured & Free modes) -->
        <div v-if="reportMode !== 'freeText'">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-muted">{{ t('reports.selectTasks') }}</label>
            <div class="flex gap-2">
              <button class="text-xs text-primary hover:underline" @click="selectAll">{{ t('reports.selectAll') }}</button>
              <span class="text-muted">|</span>
              <button class="text-xs text-primary hover:underline" @click="selectNone">{{ t('reports.selectNone') }}</button>
            </div>
          </div>
          <p class="text-xs text-muted mb-2">{{ selectedEntryIds.length }} {{ t('reports.tasksSelected') }}</p>

          <div class="space-y-2 border border-border rounded-lg p-3">
            <div
              v-for="entry in modalEntries"
              :key="entry.id"
              :class="[
                'p-3 rounded-lg border cursor-pointer transition-all',
                selectedEntryIds.includes(entry.id)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted'
              ]"
              @click="toggleEntry(entry.id)"
            >
              <div class="flex items-start gap-3">
                <input
                  type="checkbox"
                  :checked="selectedEntryIds.includes(entry.id)"
                  class="mt-1 accent-primary"
                  @click.stop
                  @change="toggleEntry(entry.id)"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs text-muted">{{ entry.date }}</span>
                    <CategoryBadge :category="entry.category" />
                  </div>
                  <p class="text-sm text-text line-clamp-2">{{ entry.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="showSelectModal = false">
            {{ t('project.cancel') }}
          </BaseButton>
          <BaseButton :loading="generating" :disabled="reportMode === 'freeText' ? !freeTextInput.trim() : selectedEntryIds.length === 0" @click="generateReport">
            {{ t('reports.generate') }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :show="!!deletingReport"
      :title="t('reports.deleteReport')"
      :message="t('reports.deleteConfirm')"
      :confirm-text="t('project.delete')"
      @confirm="handleDeleteReport"
      @cancel="deletingReport = null"
    />
  </div>
</template>
