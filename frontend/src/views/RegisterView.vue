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
const confirmPassword = ref('')

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    authStore.error = t('auth.passwordMismatch') || 'Passwords do not match'
    return
  }
  const success = await authStore.register(username.value, password.value)
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
        <p class="text-muted">{{ t('auth.createAccount') || 'Create a new account' }}</p>
      </div>

      <form
        class="bg-surface border border-border rounded-xl p-6 space-y-4"
        @submit.prevent="handleRegister"
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
        <BaseInput
          v-model="confirmPassword"
          type="password"
          :label="t('auth.confirmPassword')"
          placeholder="••••••••"
        />

        <p v-if="authStore.error" class="text-sm text-blocked">
          {{ authStore.error }}
        </p>

        <BaseButton
          type="submit"
          class="w-full"
          :loading="authStore.loading"
          :disabled="!username || !password || !confirmPassword"
        >
          {{ t('auth.register') }}
        </BaseButton>

        <p class="text-center text-sm text-muted">
          {{ t('auth.hasAccount') }}
          <router-link to="/login" class="text-primary hover:underline">
            {{ t('auth.login') }}
          </router-link>
        </p>
      </form>
    </div>
  </div>
</template>
