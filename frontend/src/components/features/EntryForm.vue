<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEntriesStore } from '../../stores/entries'
import BaseModal from '../ui/BaseModal.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseTextarea from '../ui/BaseTextarea.vue'
import BaseSelect from '../ui/BaseSelect.vue'
import BaseButton from '../ui/BaseButton.vue'

const { t } = useI18n()
const props = defineProps({
  show: Boolean,
  entry: Object,
  projectId: Number
})

const emit = defineEmits(['close', 'saved'])

const entriesStore = useEntriesStore()

const date = ref('')
const description = ref('')
const category = ref('')
const loading = ref(false)

const categoryOptions = computed(() => [
  { value: 'todo', label: t('categories.todo') },
  { value: 'in_progress', label: t('categories.in_progress') },
  { value: 'done', label: t('categories.done') },
  { value: 'deadlines', label: t('categories.deadlines') },
  { value: 'working', label: t('categories.working') },
  { value: 'completed', label: t('categories.completed') },
  { value: 'planning', label: t('categories.planning') },
  { value: 'risks_blockers', label: t('categories.risks_blockers') }
])

watch([() => props.show, () => props.entry], ([showVal, entryVal]) => {
  if (showVal) {
    if (entryVal) {
      date.value = entryVal.date || ''
      description.value = entryVal.description || ''
      category.value = entryVal.category || ''
    } else {
      date.value = new Date().toISOString().split('T')[0]
      description.value = ''
      category.value = ''
    }
  }
}, { immediate: true })

async function handleSubmit() {
  if (!date.value || !description.value || !category.value) return

  loading.value = true
  try {
    const entryData = {
      date: date.value,
      description: description.value,
      category: category.value
    }

    if (props.entry) {
      await entriesStore.updateEntry(props.entry.id, entryData)
    } else {
      await entriesStore.createEntry(props.projectId, entryData)
    }
    emit('saved')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="entry ? t('entries.editTask') : t('entries.newTask')"
    size="lg"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="date"
          type="date"
          :label="t('entries.date')"
        />
        <BaseSelect
          v-model="category"
          :options="categoryOptions"
          :label="t('entries.category')"
          :placeholder="t('entries.selectCategory')"
        />
      </div>
      <BaseTextarea
        v-model="description"
        :label="t('entries.description')"
        :placeholder="t('entries.descriptionPlaceholder')"
        :rows="6"
      />
      <div class="flex justify-end gap-3 pt-2">
        <BaseButton variant="ghost" type="button" @click="emit('close')">
          {{ t('project.cancel') }}
        </BaseButton>
        <BaseButton type="submit" :loading="loading" :disabled="!date || !description || !category">
          {{ entry ? t('project.save') : t('entries.add') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
