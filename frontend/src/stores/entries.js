import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

const API_URL = '/api'

export const useEntriesStore = defineStore('entries', () => {
  const entries = ref([])
  const loading = ref(false)

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  async function fetchEntries(projectId) {
    loading.value = true
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/entries`, {
        headers: authStore.getHeaders()
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return []
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      entries.value = data
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  async function createEntry(projectId, entry) {
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/entries`, {
        method: 'POST',
        headers: authStore.getHeaders(),
        body: JSON.stringify(entry)
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return null
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      entries.value.unshift(data)
      toastStore.show('Task eklendi', 'success')
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return null
    }
  }

  async function updateEntry(entryId, updates) {
    try {
      const res = await fetch(`${API_URL}/entries/${entryId}`, {
        method: 'PUT',
        headers: authStore.getHeaders(),
        body: JSON.stringify(updates)
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return null
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const index = entries.value.findIndex(e => e.id === entryId)
      if (index !== -1) {
        entries.value[index] = data
      }
      toastStore.show('Task güncellendi', 'success')
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return null
    }
  }

  async function deleteEntry(entryId) {
    try {
      const res = await fetch(`${API_URL}/entries/${entryId}`, {
        method: 'DELETE',
        headers: authStore.getHeaders()
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return false
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      entries.value = entries.value.filter(e => e.id !== entryId)
      toastStore.show('Task silindi', 'success')
      return true
    } catch (err) {
      toastStore.show(err.message, 'error')
      return false
    }
  }

  async function reorderEntries(reorderedEntries) {
    try {
      const res = await fetch(`${API_URL}/entries/reorder`, {
        method: 'PUT',
        headers: authStore.getHeaders(),
        body: JSON.stringify({ entries: reorderedEntries })
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return false
      }
      if (!res.ok) throw new Error('Sıralama güncellenemedi')
      reorderedEntries.forEach((item, index) => {
        const entry = entries.value.find(e => e.id === item.id)
        if (entry) {
          entry.sort_order = item.sort_order
          entry.category = item.category
        }
      })
      return true
    } catch (err) {
      toastStore.show(err.message, 'error')
      return false
    }
  }

  function getEntriesByDate() {
    const grouped = {}
    entries.value.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = []
      }
      grouped[entry.date].push(entry)
    })
    return grouped
  }

  return {
    entries,
    loading,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    reorderEntries,
    getEntriesByDate
  }
})
