import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '../router'

const API_URL = '/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(username, password) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Giriş başarısız')
      token.value = data.token
      localStorage.setItem('token', data.token)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(username, password) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız')
      token.value = data.token
      localStorage.setItem('token', data.token)
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    localStorage.removeItem('token')
  }

  function handleUnauthorized() {
    logout()
    router.push('/login')
  }

  function getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.value}`
    }
  }

  return {
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    handleUnauthorized,
    getHeaders
  }
})
