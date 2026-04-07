<script setup>
import BaseModal from '../ui/BaseModal.vue'
import BaseButton from '../ui/BaseButton.vue'

defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Onayla'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Onayla'
  },
  cancelText: {
    type: String,
    default: 'İptal'
  },
  confirmVariant: {
    type: String,
    default: 'danger'
  }
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <BaseModal :show="show" :title="title" size="sm" @close="emit('cancel')">
    <p class="text-muted mb-6">{{ message }}</p>
    <div class="flex justify-end gap-3">
      <BaseButton variant="ghost" @click="emit('cancel')">
        {{ cancelText }}
      </BaseButton>
      <BaseButton :variant="confirmVariant" @click="emit('confirm')">
        {{ confirmText }}
      </BaseButton>
    </div>
  </BaseModal>
</template>
