import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

const API_URL = '/api'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({
    provider: 'gemini',
    geminiApiKey: false,
    geminiMaskedKey: null,
    minimaxApiKey: false,
    minimaxMaskedKey: null,
    availableProviders: []
  })
  const loading = ref(false)
  const testing = ref(false)

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  async function fetchSettings() {
    loading.value = true
    try {
      const res = await fetch(`${API_URL}/settings`, {
        headers: authStore.getHeaders()
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return null
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      settings.value = data
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(newSettings) {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: authStore.getHeaders(),
        body: JSON.stringify(newSettings)
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return false
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      settings.value = data
      toastStore.show('Ayarlar kaydedildi', 'success')
      return true
    } catch (err) {
      toastStore.show(err.message, 'error')
      return false
    }
  }

  async function testConnection(provider, apiKey) {
    testing.value = true
    try {
      const res = await fetch(`${API_URL}/settings/test`, {
        method: 'POST',
        headers: authStore.getHeaders(),
        body: JSON.stringify({ provider, apiKey })
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return null
      }
      const data = await res.json()
      if (data.success) {
        toastStore.show('API bağlantısı başarılı!', 'success')
      } else {
        toastStore.show(data.message || 'Bağlantı başarısız', 'error')
      }
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return null
    } finally {
      testing.value = false
    }
  }

  return {
    settings,
    loading,
    testing,
    fetchSettings,
    updateSettings,
    testConnection
  }
})
