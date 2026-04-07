import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

const API_URL = '/api'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref([])
  const currentProject = ref(null)
  const loading = ref(false)

  const authStore = useAuthStore()
  const toastStore = useToastStore()

  async function fetchProjects() {
    loading.value = true
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: authStore.getHeaders()
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return []
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      projects.value = data
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  async function createProject(name) {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: authStore.getHeaders(),
        body: JSON.stringify({ name })
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return null
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      projects.value.unshift(data)
      toastStore.show('Proje oluşturuldu', 'success')
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return null
    }
  }

  async function updateProject(id, name) {
    try {
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: authStore.getHeaders(),
        body: JSON.stringify({ name })
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return null
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], name }
      }
      if (currentProject.value?.id === id) {
        currentProject.value = { ...currentProject.value, name }
      }
      toastStore.show('Proje güncellendi', 'success')
      return data
    } catch (err) {
      toastStore.show(err.message, 'error')
      return null
    }
  }

  async function deleteProject(id) {
    try {
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: authStore.getHeaders()
      })
      if (res.status === 401) {
        authStore.handleUnauthorized()
        return false
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      projects.value = projects.value.filter(p => p.id !== id)
      if (currentProject.value?.id === id) {
        currentProject.value = projects.value[0] || null
      }
      toastStore.show('Proje silindi', 'success')
      return true
    } catch (err) {
      toastStore.show(err.message, 'error')
      return false
    }
  }

  function setCurrentProject(project) {
    currentProject.value = project
  }

  return {
    projects,
    currentProject,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject
  }
})
