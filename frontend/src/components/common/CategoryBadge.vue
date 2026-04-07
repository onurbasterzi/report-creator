<script setup>
import { useI18n } from 'vue-i18n'
import BaseBadge from '../ui/BaseBadge.vue'

const { t } = useI18n()

defineProps({
  category: {
    type: String,
    required: true
  }
})
</script>

<template>
  <BaseBadge :variant="category">
    {{ t('categories.' + category) }}
  </BaseBadge>
</template>
