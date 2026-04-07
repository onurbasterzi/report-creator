<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useReportsStore } from '../stores/reports'
import { useToastStore } from '../stores/toast'
import { useSettingsStore } from '../stores/settings'
import AppHeader from '../components/layout/AppHeader.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const reportsStore = useReportsStore()
const toastStore = useToastStore()
const settingsStore = useSettingsStore()

const report = ref(null)
const loading = ref(false)
const isEditing = ref(false)
const editedContent = ref('')
const showDeleteModal = ref(false)
const saving = ref(false)
const textareaRef = ref(null)

// AI Edit state
const aiCommand = ref('')
const aiEditing = ref(false)
const aiProvider = ref('gemini')
const aiModel = ref('gemini-3.1-flash-lite-preview')
const aiLanguage = ref('en')

const API_URL = '/api'

const providerOptions = computed(() => {
  if (settingsStore.settings.availableProviders?.length > 0) {
    return settingsStore.settings.availableProviders.map(p => ({
      value: p.id,
      label: p.name
    }))
  }
  return [
    { value: 'gemini', label: 'Google Gemini' },
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

const aiModelOptions = computed(() => {
  if (aiProvider.value === 'minimax') return minimaxModels
  if (aiProvider.value === 'gemini_cli') return geminiCliModels
  return geminiApiModels
})

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' }
]

const quickCommands = [
  { label: 'More formal', value: 'Make this more formal and professional' },
  { label: 'Shorter', value: 'Make this shorter and more concise' },
  { label: 'Longer', value: 'Make this longer and more detailed' },
  { label: 'Fix grammar', value: 'Fix grammar and spelling errors' }
]

async function fetchReport() {
  loading.value = true
  try {
    const res = await fetch(`${API_URL}/reports/${route.params.id}`, {
      headers: authStore.getHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    report.value = data
    editedContent.value = data.content
  } catch (err) {
    toastStore.show(err.message, 'error')
    router.push('/reports')
  } finally {
    loading.value = false
  }
}

function toggleEdit() {
  if (isEditing.value) {
    // Cancel edit, restore original
    editedContent.value = report.value.content
  }
  isEditing.value = !isEditing.value
}

async function saveContent() {
  if (!editedContent.value.trim()) {
    toastStore.show('İçerik boş olamaz', 'error')
    return
  }

  saving.value = true
  try {
    const res = await fetch(`${API_URL}/reports/${route.params.id}`, {
      method: 'PUT',
      headers: authStore.getHeaders(),
      body: JSON.stringify({ content: editedContent.value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    report.value.content = editedContent.value
    isEditing.value = false
    toastStore.show('Rapor kaydedildi', 'success')
  } catch (err) {
    toastStore.show(err.message, 'error')
  } finally {
    saving.value = false
  }
}

async function deleteReport() {
  const success = await reportsStore.deleteReport(route.params.id)
  if (success) {
    router.push('/reports')
  }
}

function copyToClipboard() {
  if (report.value?.content) {
    navigator.clipboard.writeText(report.value.content)
    toastStore.show('Panoya kopyalandı', 'success')
  }
}

function downloadMarkdown() {
  if (!report.value?.content) return

  const blob = new Blob([report.value.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rapor-${report.value.id}.md`
  a.click()
  URL.revokeObjectURL(url)
  toastStore.show('İndirildi', 'success')
}

async function applyAiEdit() {
  if (!textareaRef.value) return

  const textarea = textareaRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedTextVal = editedContent.value.substring(start, end)

  // If no text selected and no command, show error
  if (!selectedTextVal.trim() && !aiCommand.value.trim()) {
    toastStore.show('Metin seçin veya komut girin', 'error')
    return
  }

  aiEditing.value = true
  try {
    const res = await fetch(`${API_URL}/reports/${route.params.id}/edit`, {
      method: 'POST',
      headers: authStore.getHeaders(),
      body: JSON.stringify({
        text: selectedTextVal.trim() || editedContent.value,
        command: aiCommand.value.trim() || 'Regenerate this text with the same content but in the specified language',
        provider: aiProvider.value,
        model: aiModel.value,
        language: aiLanguage.value
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    // Replace content based on whether text was selected
    if (selectedTextVal.trim()) {
      editedContent.value = editedContent.value.substring(0, start) + data.result + editedContent.value.substring(end)
    } else {
      editedContent.value = data.result
    }
    toastStore.show('Metin güncellendi', 'success')
  } catch (err) {
    toastStore.show(err.message, 'error')
  } finally {
    aiEditing.value = false
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

// Simple markdown to HTML converter
function renderMarkdown(text) {
  if (!text) return ''

  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-text mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-text mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-text mt-6 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-text">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="italic text-text">$1</em>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="text-text mb-3">')
    .replace(/\n/g, '<br>')

  return `<p class="text-text mb-3">${html}</p>`
}

onMounted(async () => {
  await Promise.all([fetchReport(), settingsStore.fetchSettings()])
})
</script>

<template>
  <div class="flex flex-col h-full">
    <AppHeader :title="t('reports.title')">
      <!-- Desktop: buttons in header -->
      <div class="hidden md:flex items-center gap-2">
        <BaseButton size="sm" variant="secondary" @click="copyToClipboard">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {{ t('reports.copy') }}
        </BaseButton>
        <BaseButton size="sm" variant="secondary" @click="downloadMarkdown">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {{ t('reports.download') }}
        </BaseButton>
        <BaseButton
          size="sm"
          :variant="isEditing ? 'primary' : 'secondary'"
          @click="toggleEdit"
        >
          <svg v-if="!isEditing" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {{ isEditing ? t('project.cancel') : t('project.edit') }}
        </BaseButton>
        <BaseButton
          v-if="isEditing"
          size="sm"
          :loading="saving"
          @click="saveContent"
        >
          {{ t('project.save') }}
        </BaseButton>
        <BaseButton size="sm" variant="danger" @click="showDeleteModal = true">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </BaseButton>
      </div>
    </AppHeader>

    <!-- Mobile: buttons toolbar below header -->
    <div class="md:hidden flex items-center justify-center gap-1 p-2 bg-surface border-b border-border">
      <BaseButton size="sm" variant="secondary" @click="copyToClipboard">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      </BaseButton>
      <BaseButton size="sm" variant="secondary" @click="downloadMarkdown">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </BaseButton>
      <BaseButton
        size="sm"
        :variant="isEditing ? 'primary' : 'secondary'"
        @click="toggleEdit"
      >
        <svg v-if="!isEditing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span v-else>X</span>
      </BaseButton>
      <BaseButton
        v-if="isEditing"
        size="sm"
        :loading="saving"
        @click="saveContent"
      >
        {{ t('project.save') }}
      </BaseButton>
      <BaseButton size="sm" variant="danger" @click="showDeleteModal = true">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </BaseButton>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <LoadingSpinner v-if="loading" />

      <template v-else-if="report">
        <div class="max-w-4xl mx-auto">
          <p class="text-sm text-muted mb-6 text-center">{{ formatDate(report.generated_at) }}</p>

          <!-- Edit Mode -->
          <div v-if="isEditing" class="space-y-4 h-[calc(100vh-220px)]">
            <!-- AI Edit Tools -->
            <div class="bg-surface border border-border rounded-xl p-4">
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span class="text-sm font-medium text-text">{{ t('reports.aiEdit') }}</span>
              </div>

              <!-- Quick Commands -->
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  v-for="cmd in quickCommands"
                  :key="cmd.value"
                  class="px-3 py-1 text-xs bg-background border border-border rounded-full hover:border-primary transition-colors"
                  :class="{ 'border-primary bg-primary/10': aiCommand === cmd.value }"
                  @click="aiCommand = cmd.value"
                >
                  {{ cmd.label }}
                </button>
              </div>

              <div class="flex flex-col md:flex-row gap-2">
                <input
                  v-model="aiCommand"
                  type="text"
                  :placeholder="t('reports.enterCommand')"
                  class="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-primary"
                />
                <div class="flex flex-wrap md:flex-nowrap gap-2">
                  <BaseSelect
                    v-model="aiLanguage"
                    :options="languageOptions"
                    class="w-full md:w-28"
                  />
                  <BaseSelect
                    v-model="aiProvider"
                    :options="providerOptions"
                    class="w-full md:w-32"
                  />
                  <BaseSelect
                    v-model="aiModel"
                    :options="aiModelOptions"
                    class="w-full md:w-40"
                  />
                  <BaseButton
                    :loading="aiEditing"
                    class="w-full md:w-auto px-4"
                    @click="applyAiEdit"
                  >
                    {{ t('reports.apply') }}
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- Textarea -->
            <textarea
              ref="textareaRef"
              v-model="editedContent"
              class="w-full h-[calc(100%-140px)] bg-surface border border-border rounded-xl p-4 text-text font-mono text-sm resize-none focus:outline-none focus:border-primary"
              :placeholder="t('reports.reportContent')"
            />
          </div>

          <!-- View Mode with Markdown -->
          <div
            v-else
            class="bg-surface border border-border rounded-xl p-8"
            v-html="renderMarkdown(report.content)"
          />
        </div>
      </template>
    </div>

    <!-- Delete Confirmation -->
    <ConfirmModal
      :show="showDeleteModal"
      :title="t('reports.deleteReport')"
      :message="t('reports.deleteConfirmDetail')"
      :confirm-text="t('project.delete')"
      @confirm="deleteReport"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
