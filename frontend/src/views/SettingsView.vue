<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settings'
import AppHeader from '../components/layout/AppHeader.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import BaseButton from '../components/ui/BaseButton.vue'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const selectedProvider = ref('gemini')
const apiKey = ref('')
const saving = ref(false)

const providerOptions = computed(() => [
  { value: 'gemini', label: t('providers.gemini') },
  { value: 'gemini_cli', label: t('providers.gemini_cli') },
  { value: 'minimax', label: t('providers.minimax') }
])

onMounted(async () => {
  await settingsStore.fetchSettings()
  selectedProvider.value = settingsStore.settings.provider || 'gemini'
})

async function saveApiKey() {
  if (selectedProvider.value !== 'gemini_cli' && !apiKey.value) return

  saving.value = true
  try {
    if (selectedProvider.value === 'gemini') {
      await settingsStore.updateSettings({
        provider: selectedProvider.value,
        geminiApiKey: apiKey.value
      })
    } else if (selectedProvider.value === 'gemini_cli') {
      await settingsStore.updateSettings({
        provider: selectedProvider.value
      })
    } else {
      await settingsStore.updateSettings({
        provider: selectedProvider.value,
        minimaxApiKey: apiKey.value
      })
    }
    apiKey.value = ''
  } finally {
    saving.value = false
  }
}

async function testConnection() {
  if (selectedProvider.value === 'gemini_cli') {
    await settingsStore.testConnection(selectedProvider.value, null)
  } else {
    const key = apiKey.value || (selectedProvider.value === 'gemini'
      ? (settingsStore.settings.geminiMaskedKey ? 'test' : '')
      : (settingsStore.settings.minimaxMaskedKey ? 'test' : ''))
    await settingsStore.testConnection(selectedProvider.value, key)
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <AppHeader :title="t('settings.title')" :subtitle="t('settings.subtitle')" />

    <div class="flex-1 overflow-auto p-6">
      <div class="max-w-md space-y-6">
        <!-- API Key Section -->
        <div class="bg-surface border border-border rounded-xl p-6">
          <h3 class="text-base font-medium text-text mb-4">{{ t('settings.apiKeyTitle') }}</h3>

          <div class="space-y-4">
            <BaseSelect
              v-model="selectedProvider"
              :options="providerOptions"
              :label="t('settings.aiProvider')"
            />

            <div v-if="selectedProvider !== 'gemini_cli'">
              <label class="block text-sm font-medium text-muted mb-1.5">{{ t('settings.apiKey') }}</label>
              <input
                v-model="apiKey"
                type="password"
                :placeholder="selectedProvider === 'gemini' ? t('settings.geminiApiKeyPlaceholder') : t('settings.minimaxApiKeyPlaceholder')"
                class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text placeholder-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div v-else class="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-text">
              {{ t('settings.geminiCliInfo') }}
            </div>

            <div class="flex gap-3">
              <BaseButton
                size="sm"
                variant="secondary"
                :loading="settingsStore.testing"
                @click="testConnection"
              >
                {{ t('settings.test') }}
              </BaseButton>
              <BaseButton
                :loading="saving"
                :disabled="selectedProvider !== 'gemini_cli' && !apiKey"
                @click="saveApiKey"
              >
                {{ t('settings.save') }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Saved API Keys -->
        <div v-if="settingsStore.settings.geminiMaskedKey || settingsStore.settings.minimaxMaskedKey" class="bg-surface border border-border rounded-xl p-6">
          <h3 class="text-base font-medium text-text mb-4">{{ t('settings.savedKeys') }}</h3>

          <div class="space-y-3">
            <!-- Gemini -->
            <div v-if="settingsStore.settings.geminiMaskedKey" class="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-done" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p class="text-sm text-text font-medium">{{ t('providers.gemini') }}</p>
                  <p class="text-xs text-muted font-mono">{{ settingsStore.settings.geminiMaskedKey }}</p>
                </div>
              </div>
            </div>

            <!-- MiniMax -->
            <div v-if="settingsStore.settings.minimaxMaskedKey" class="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-done" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p class="text-sm text-text font-medium">{{ t('providers.minimax') }}</p>
                  <p class="text-xs text-muted font-mono">{{ settingsStore.settings.minimaxMaskedKey }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API Key Links -->
        <div class="bg-surface border border-border rounded-xl p-6">
          <h3 class="text-sm font-medium text-text mb-4">{{ t('settings.apiKeyHelp') }}</h3>
          <ul class="space-y-3 text-sm">
            <li class="flex items-start gap-3">
              <span class="text-primary font-medium min-w-[20px]">1.</span>
              <div>
                <span class="text-text">{{ t('providers.gemini') }}</span>
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  class="text-primary hover:underline ml-2"
                >
                  {{ t('settings.getApiKey') }}
                </a>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-primary font-medium min-w-[20px]">2.</span>
              <div>
                <span class="text-text">{{ t('providers.minimax') }}</span>
                <a
                  href="https://platform.minimax.io/user-center/payment/token-plan/"
                  target="_blank"
                  class="text-primary hover:underline ml-2"
                >
                  {{ t('settings.platform') }}
                </a>
              </div>
            </li>
          </ul>
        </div>

        <!-- Info Box -->
        <div class="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <p class="text-sm text-text">
            <strong class="text-primary">{{ t('settings.apiKeySafe').split(':')[0] }}:</strong> {{ t('settings.apiKeySafe').split(':')[1] }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>