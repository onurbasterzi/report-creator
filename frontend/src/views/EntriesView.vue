<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projects'
import { useEntriesStore } from '../stores/entries'
import AppHeader from '../components/layout/AppHeader.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import EmptyState from '../components/common/EmptyState.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import EntryForm from '../components/features/EntryForm.vue'
import ConfirmModal from '../components/common/ConfirmModal.vue'
import CategoryBadge from '../components/common/CategoryBadge.vue'

const { t } = useI18n()
const route = useRoute()
const projectsStore = useProjectsStore()
const entriesStore = useEntriesStore()

const viewMode = ref('kanban')
const showEntryForm = ref(false)
const editingEntry = ref(null)
const deletingEntry = ref(null)
const draggingEntry = ref(null)

const filterOptions = computed(() => [
  { id: 'all', label: t('entries.filterAll') },
  { id: 'report', label: t('entries.filterReportIncluded') },
  { id: 'no-report', label: t('entries.filterReportExcluded') }
])

const columns = [
  { id: 'todo', color: 'bg-yellow-500', reportEligible: false },
  { id: 'in_progress', color: 'bg-primary', reportEligible: false },
  { id: 'done', color: 'bg-done', reportEligible: false },
  { id: 'completed', color: 'bg-emerald-600', reportEligible: true },
  { id: 'working', color: 'bg-cyan-500', reportEligible: true },
  { id: 'planning', color: 'bg-orange-500', reportEligible: true },
  { id: 'deadlines', color: 'bg-purple-500', reportEligible: true },
  { id: 'risks_blockers', color: 'bg-red-500', reportEligible: true }
]

const selectedFilter = ref('all')

const filteredColumns = computed(() => {
  if (selectedFilter.value === 'report') {
    return columns.filter(c => c.reportEligible)
  } else if (selectedFilter.value === 'no-report') {
    return columns.filter(c => !c.reportEligible)
  }
  return columns
})

onMounted(async () => {
  const projectId = route.query.projectId
  if (projectId) {
    const project = projectsStore.projects.find(p => p.id === Number(projectId))
    if (project) {
      projectsStore.setCurrentProject(project)
    }
  }
  if (projectsStore.currentProject) {
    await entriesStore.fetchEntries(projectsStore.currentProject.id)
  }
})

watch(
  () => route.query.projectId,
  async (newProjectId) => {
    if (newProjectId) {
      const project = projectsStore.projects.find(p => p.id === Number(newProjectId))
      if (project) {
        projectsStore.setCurrentProject(project)
      }
    }
  }
)

watch(
  () => projectsStore.currentProject,
  async (project) => {
    if (project) {
      await entriesStore.fetchEntries(project.id)
    }
  }
)

function getEntriesByCategory(category) {
  return entriesStore.entries
    .filter(e => e.category === category)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

function getEntriesByDate() {
  return [...entriesStore.entries].sort((a, b) => b.date.localeCompare(a.date))
}

function openNewEntry() {
  editingEntry.value = null
  showEntryForm.value = true
}

function openEditEntry(entry) {
  editingEntry.value = entry
  showEntryForm.value = true
}

function confirmDelete(entry) {
  deletingEntry.value = entry
}

async function handleDelete() {
  if (deletingEntry.value) {
    await entriesStore.deleteEntry(deletingEntry.value.id)
    deletingEntry.value = null
  }
}

function getCategoryClass(category) {
  const classes = {
    'done': 'bg-done/20 text-done',
    'in_progress': 'bg-primary/20 text-primary',
    'todo': 'bg-yellow-500/20 text-yellow-600',
    'deadlines': 'bg-purple-500/20 text-purple-600',
    'working': 'bg-cyan-500/20 text-cyan-600',
    'completed': 'bg-emerald-600/20 text-emerald-600',
    'planning': 'bg-orange-500/20 text-orange-600',
    'risks_blockers': 'bg-red-500/20 text-red-600'
  }
  return classes[category] || classes['planning']
}

function getCategoryLabel(category) {
  const labels = {
    'done': t('categories.done'),
    'in_progress': t('categories.in_progress'),
    'todo': t('categories.todo'),
    'deadlines': t('categories.deadlines'),
    'working': t('categories.working'),
    'completed': t('categories.completed'),
    'planning': t('categories.planning'),
    'risks_blockers': t('categories.risks_blockers')
  }
  return labels[category] || category
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Drag and Drop
function onDragStart(event, entry) {
  draggingEntry.value = entry
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', entry.id)
  event.target.classList.add('opacity-50')
}

function onDragEnd(event) {
  event.target.classList.remove('opacity-50')
  draggingEntry.value = null
}

function onDragOver(event) {
  event.preventDefault()
}

function onDrop(event, targetCategory) {
  event.preventDefault()
  if (!draggingEntry.value) return

  const targetEntries = entriesStore.entries.filter(e => e.category === targetCategory)
  const newSortOrder = targetEntries.length

  entriesStore.updateEntry(draggingEntry.value.id, {
    ...draggingEntry.value,
    category: targetCategory,
    sort_order: newSortOrder
  })
  draggingEntry.value = null
}

function onDragOverCard(event, entry) {
  event.preventDefault()
  event.stopPropagation()
}

async function onDropOnCard(event, targetEntry) {
  event.preventDefault()
  event.stopPropagation()
  if (!draggingEntry.value || draggingEntry.value.id === targetEntry.id) {
    draggingEntry.value = null
    return
  }

  const sourceCategory = draggingEntry.value.category
  const targetCategory = targetEntry.category

  if (sourceCategory !== targetCategory) {
    // Moving to different category
    await entriesStore.updateEntry(draggingEntry.value.id, {
      ...draggingEntry.value,
      category: targetCategory
    })
  } else {
    // Same category - reorder within column
    await reorderInColumnAt(sourceCategory, draggingEntry.value.id, targetEntry.id)
  }
  draggingEntry.value = null
}

async function reorderInColumn(category) {
  const columnEntries = entriesStore.entries.filter(e => e.category === category)
  const reordered = columnEntries.map((e, index) => ({
    id: e.id,
    category: e.category,
    sort_order: index
  }))
  await entriesStore.reorderEntries(reordered)
}

async function reorderInColumnAt(category, draggedId, targetId) {
  const columnEntries = entriesStore.entries
    .filter(e => e.category === category)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const draggedIndex = columnEntries.findIndex(e => e.id === draggedId)
  const targetIndex = columnEntries.findIndex(e => e.id === targetId)

  if (draggedIndex === -1 || targetIndex === -1) return

  // Remove dragged entry and insert at target position
  const [draggedEntry] = columnEntries.splice(draggedIndex, 1)
  columnEntries.splice(targetIndex, 0, draggedEntry)

  // Update sort orders
  const reordered = columnEntries.map((e, index) => ({
    id: e.id,
    category: e.category,
    sort_order: index
  }))

  await entriesStore.reorderEntries(reordered)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <AppHeader
      :title="t('entries.title')"
      :subtitle="projectsStore.currentProject?.name"
    >
      <BaseButton @click="openNewEntry">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ t('entries.new') }}
      </BaseButton>
    </AppHeader>

    <div class="flex-1 overflow-auto p-6">
      <template v-if="projectsStore.currentProject">
        <LoadingSpinner v-if="entriesStore.loading" />

        <EmptyState
          v-else-if="entriesStore.entries.length === 0"
          :title="t('entries.noEntries')"
          :description="t('entries.addProgress')"
        >
          <BaseButton class="mt-4" @click="openNewEntry">
            {{ t('entries.addFirst') }}
          </BaseButton>
        </EmptyState>

        <div v-else>
          <!-- View Toggle -->
          <div class="flex justify-end mb-4">
            <div class="flex gap-2 items-center">
              <select
                v-model="selectedFilter"
                class="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
              >
                <option v-for="opt in filterOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
              <div class="flex gap-1">
                <button
                  :class="['p-2 rounded transition-colors', viewMode === 'kanban' ? 'bg-primary text-white' : 'text-muted hover:text-text hover:bg-surface']"
                  @click="viewMode = 'kanban'"
                  :title="t('dashboard.kanban')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </button>
                <button
                  :class="['p-2 rounded transition-colors', viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-text hover:bg-surface']"
                  @click="viewMode = 'grid'"
                  :title="t('dashboard.grid')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  :class="['p-2 rounded transition-colors', viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-text hover:bg-surface']"
                  @click="viewMode = 'list'"
                  :title="t('dashboard.list')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- KANBAN VIEW -->
          <div
            v-if="viewMode === 'kanban'"
            class="hidden md:flex gap-4 h-full overflow-x-auto pb-4"
          >
            <div
              v-for="column in filteredColumns"
              :key="column.id"
              class="flex-1 min-w-0 bg-surface/50 rounded-xl p-3"
              @dragover="onDragOver"
              @drop="onDrop($event, column.id)"
            >
              <div class="flex items-center gap-2 mb-3 px-1">
                <div :class="['w-3 h-3 rounded-full', column.color]" />
                <h3 class="text-sm font-medium text-text">{{ t('categories.' + column.id) }}</h3>
                <span class="text-xs text-muted ml-auto">({{ getEntriesByCategory(column.id).length }})</span>
              </div>

              <div class="space-y-2">
                <div
                  v-for="entry in getEntriesByCategory(column.id)"
                  :key="entry.id"
                  draggable="true"
                  :class="[
                    'border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary transition-colors',
                    entry.category === 'done' ? 'bg-done/5 border-done/20 hover:bg-done/10' :
                    entry.category === 'in_progress' ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' :
                    entry.category === 'todo' ? 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10' :
                    entry.category === 'deadlines' ? 'bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10' :
                    entry.category === 'working' ? 'bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10' :
                    entry.category === 'completed' ? 'bg-emerald-600/5 border-emerald-600/20 hover:bg-emerald-600/10' :
                    entry.category === 'planning' ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10' :
                    'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                  ]"
                  @dragstart="onDragStart($event, entry)"
                  @dragend="onDragEnd"
                  @dragover="onDragOverCard($event, entry)"
                  @drop="onDropOnCard($event, entry)"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs text-muted">{{ formatDate(entry.date) }}</span>
                  </div>
                  <p class="text-sm text-text line-clamp-3">{{ entry.description }}</p>
                  <div class="mt-2 pt-2 border-t border-border flex justify-end gap-1">
                    <button
                      class="p-1.5 text-muted hover:text-primary rounded hover:bg-primary/10"
                      :title="t('project.edit')"
                      @click.stop="openEditEntry(entry)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      class="p-1.5 text-muted hover:text-blocked rounded hover:bg-blocked/10"
                      :title="t('project.delete')"
                      @click.stop="confirmDelete(entry)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div
                  v-if="getEntriesByCategory(column.id).length === 0"
                  class="text-center py-8 text-xs text-muted border-2 border-dashed border-border rounded-lg"
                >
                  {{ t('entries.noTasks') }}
                </div>
              </div>
            </div>
          </div>

          <!-- MOBILE: Kanban as list (shown below md breakpoint) -->
          <div
            v-if="viewMode === 'kanban'"
            class="md:hidden space-y-3"
          >
            <div
              v-for="column in filteredColumns"
              :key="column.id"
              class="bg-surface border border-border rounded-xl p-4"
            >
              <div class="flex items-center gap-2 mb-3">
                <div :class="['w-3 h-3 rounded-full', column.color]" />
                <h3 class="text-sm font-medium text-text">{{ t('categories.' + column.id) }}</h3>
                <span class="text-xs text-muted ml-auto">({{ getEntriesByCategory(column.id).length }})</span>
              </div>

              <div class="space-y-2">
                <div
                  v-for="entry in getEntriesByCategory(column.id)"
                  :key="entry.id"
                  :class="[
                    'border rounded-lg p-3',
                    entry.category === 'done' ? 'bg-done/5 border-done/20' :
                    entry.category === 'in_progress' ? 'bg-primary/5 border-primary/20' :
                    entry.category === 'todo' ? 'bg-yellow-500/5 border-yellow-500/20' :
                    entry.category === 'deadlines' ? 'bg-purple-500/5 border-purple-500/20' :
                    entry.category === 'working' ? 'bg-cyan-500/5 border-cyan-500/20' :
                    entry.category === 'completed' ? 'bg-emerald-600/5 border-emerald-600/20' :
                    entry.category === 'planning' ? 'bg-orange-500/5 border-orange-500/20' :
                    'bg-red-500/5 border-red-500/20'
                  ]"
                  @click="openEditEntry(entry)"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs text-muted">{{ formatDate(entry.date) }}</span>
                  </div>
                  <p class="text-sm text-text">{{ entry.description }}</p>
                </div>

                <div
                  v-if="getEntriesByCategory(column.id).length === 0"
                  class="text-center py-4 text-xs text-muted"
                >
                  {{ t('entries.noTasks') }}
                </div>
              </div>
            </div>
          </div>

          <!-- GRID VIEW -->
          <div
            v-else-if="viewMode === 'grid'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="entry in getEntriesByDate()"
              :key="entry.id"
              class="bg-surface border border-border rounded-xl p-4 hover:border-primary transition-colors group"
            >
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs text-muted">{{ formatDate(entry.date) }}</span>
                <span :class="['px-2 py-0.5 rounded text-xs', getCategoryClass(entry.category)]">
                  {{ getCategoryLabel(entry.category) }}
                </span>
                <div class="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-1 text-muted hover:text-primary rounded hover:bg-primary/10"
                    title="Düzenle"
                    @click.stop="openEditEntry(entry)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    class="p-1 text-muted hover:text-blocked rounded hover:bg-blocked/10"
                    title="Sil"
                    @click.stop="confirmDelete(entry)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p class="text-sm text-text line-clamp-4 cursor-pointer" @click.stop="openEditEntry(entry)">{{ entry.description }}</p>
            </div>
          </div>

          <!-- LIST VIEW -->
          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="entry in getEntriesByDate()"
              :key="entry.id"
              class="bg-surface border border-border rounded-xl p-4 hover:border-primary transition-colors group"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-sm text-muted">{{ formatDate(entry.date) }}</span>
                  <span :class="['px-2 py-0.5 rounded text-xs', getCategoryClass(entry.category)]">
                    {{ getCategoryLabel(entry.category) }}
                  </span>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-1.5 text-muted hover:text-primary rounded hover:bg-primary/10"
                    title="Düzenle"
                    @click.stop="openEditEntry(entry)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 text-muted hover:text-blocked rounded hover:bg-blocked/10"
                    title="Sil"
                    @click.stop="confirmDelete(entry)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p class="text-sm text-text mt-2 cursor-pointer" @click.stop="openEditEntry(entry)">{{ entry.description }}</p>
            </div>
          </div>
        </div>
      </template>

      <EmptyState
        v-else
        :title="t('entries.noProjectSelected')"
        :description="t('entries.selectProject')"
      />
    </div>

    <!-- Entry Form Modal -->
    <EntryForm
      v-if="showEntryForm && projectsStore.currentProject"
      :show="showEntryForm"
      :entry="editingEntry"
      :project-id="projectsStore.currentProject.id"
      @close="showEntryForm = false"
      @saved="showEntryForm = false"
    />

    <!-- Delete Confirmation -->
    <ConfirmModal
      :show="!!deletingEntry"
      :title="t('entries.deleteTitle')"
      :message="t('entries.deleteConfirm')"
      :confirm-text="t('project.delete')"
      @confirm="handleDelete"
      @cancel="deletingEntry = null"
    />
  </div>
</template>
