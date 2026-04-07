<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import ToastNotification from './components/common/ToastNotification.vue'

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  document.documentElement.classList.toggle('dark', savedTheme === 'dark')
})
</script>

<template>
  <RouterView />
  <ToastNotification />
</template>
