import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

const API_URL = '/api'

export const useReportsStore = defineStore('reports', () => {
  const reports = ref([])
  const loading = ref(false)

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  async function fetchReports(projectId) {
    loading.value = true
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/reports`, {
        headers: authStore.getHeaders()
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return []
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      reports.value = data
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  async function deleteReport(reportId) {
    try {
      const res = await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: authStore.getHeaders()
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return false
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      reports.value = reports.value.filter(r => r.id !== reportId)
      toastStore.show('Rapor silindi', 'success')
      return true
    } catch (err) {
      toastStore.show(err.message, 'error')
      return false
    }
  }

  async function updateReport(reportId, content) {
    try {
      const res = await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'PUT',
        headers: authStore.getHeaders(),
        body: JSON.stringify({ content })
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return false
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toastStore.show('Rapor kaydedildi', 'success')
      return true
    } catch (err) {
      toastStore.show(err.message, 'error')
      return false
    }
  }

  return {
    reports,
    loading,
    fetchReports,
    deleteReport,
    updateReport
  }
})
