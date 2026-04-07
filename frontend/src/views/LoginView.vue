<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseInput from '../components/ui/BaseInput.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')

async function handleLogin() {
  const success = await authStore.login(username.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-text mb-2">{{ t('app.name') }}</h1>
        <p class="text-muted">{{ t('auth.subtitle') || 'Create your sprint reports with AI' }}</p>
      </div>

      <form
        class="bg-surface border border-border rounded-xl p-6 space-y-4"
        @submit.prevent="handleLogin"
      >
        <BaseInput
          v-model="username"
          :label="t('auth.username')"
          placeholder="username"
        />
        <BaseInput
          v-model="password"
          type="password"
          :label="t('auth.password')"
          placeholder="••••••••"
        />

        <p v-if="authStore.error" class="text-sm text-blocked">
          {{ authStore.error }}
        </p>

        <BaseButton
          type="submit"
          class="w-full"
          :loading="authStore.loading"
          :disabled="!username || !password"
        >
          {{ t('auth.login') }}
        </BaseButton>

        <p class="text-center text-sm text-muted">
          {{ t('auth.noAccount') }}
          <router-link to="/register" class="text-primary hover:underline">
            {{ t('auth.register') }}
          </router-link>
        </p>
      </form>
    </div>
  </div>
</template>
