<script setup lang="ts">
import {
  addYears,
  differenceInCalendarDays,
  format as formatDate,
  startOfDay,
} from 'date-fns'
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../stores/app'
import type { EmploymentSpan } from '../types'
import BaseButton from './base/BaseButton.vue'
import BaseDatePicker from './base/BaseDatePicker.vue'
import BaseInput from './base/BaseInput.vue'

const store = useAppStore()

// OPT Period
const optStartDate = ref<Date | null>(store.optPeriod?.startDate ?? null)
const optEndDate = ref<Date | null>(store.optPeriod?.endDate ?? null)

// STEM Period
const stemStartDate = ref<Date | null>(store.stemPeriod?.startDate ?? null)
const stemEndDate = ref<Date | null>(store.stemPeriod?.endDate ?? null)

// Employment form
const employerName = ref('')
const employmentStart = ref<Date | null>(null)
const employmentEnd = ref<Date | null>(null)
const isOngoing = ref(false)
const editingId = ref<string | null>(null)

const isEditing = computed(() => editingId.value !== null)
const formValid = computed(() => {
  return employerName.value.trim() !== '' && employmentStart.value !== null
})

function datesMatch(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return a.getTime() === b.getTime()
}

function addYearMinusOneDay(date: Date): Date {
  const result = addYears(date, 1)
  return startOfDay(new Date(result.getTime() - 86400000))
}

function addTwoYearsMinusOneDay(date: Date): Date {
  const result = addYears(date, 2)
  return startOfDay(new Date(result.getTime() - 86400000))
}

watch(
  () => store.optPeriod,
  (period) => {
    optStartDate.value = period?.startDate ?? null
    optEndDate.value = period?.endDate ?? null
  },
  { immediate: true }
)

watch(
  () => store.stemPeriod,
  (period) => {
    stemStartDate.value = period?.startDate ?? null
    stemEndDate.value = period?.endDate ?? null
  },
  { immediate: true }
)

watch(
  [optStartDate, optEndDate],
  ([start, end]) => {
    if (start && !optEndDate.value) {
      optEndDate.value = addYearMinusOneDay(start)
    }

    if (
      start &&
      end &&
      (!store.optPeriod ||
        !datesMatch(store.optPeriod.startDate, start) ||
        !datesMatch(store.optPeriod.endDate, end))
    ) {
      store.setOPTPeriod(start, end)
    }
  }
)

watch(
  [stemStartDate, stemEndDate],
  ([start, end]) => {
    if (start && !stemEndDate.value) {
      stemEndDate.value = addTwoYearsMinusOneDay(start)
    }

    if (
      start &&
      end &&
      (!store.stemPeriod ||
        !datesMatch(store.stemPeriod.startDate, start) ||
        !datesMatch(store.stemPeriod.endDate, end))
    ) {
      store.setSTEMPeriod(start, end)
    }
  }
)

function addEmployment() {
  if (!formValid.value) return

  const endDate = isOngoing.value ? null : employmentEnd.value

  if (isEditing.value && editingId.value) {
    store.updateEmploymentSpan(
      editingId.value,
      employerName.value,
      employmentStart.value!,
      endDate
    )
  } else {
    store.addEmploymentSpan(
      employerName.value,
      employmentStart.value!,
      endDate
    )
  }

  resetEmploymentForm()
}

function editEmployment(span: EmploymentSpan) {
  editingId.value = span.id
  employerName.value = span.employerName
  employmentStart.value = span.startDate
  employmentEnd.value = span.endDate
  isOngoing.value = span.endDate === null
}

function deleteEmployment(id: string) {
  if (confirm('Are you sure you want to delete this employment record?')) {
    store.deleteEmploymentSpan(id)
  }
}

function formatDateDisplay(date: Date): string {
  return formatDate(date, 'PP')
}

function getEmploymentDuration(span: EmploymentSpan): string {
  const start = startOfDay(span.startDate)
  const end = span.endDate ? startOfDay(span.endDate) : startOfDay(new Date())
  const totalDays = differenceInCalendarDays(end, start) + 1

  if (totalDays <= 0) {
    return '0 days'
  }

  return `${totalDays} day${totalDays === 1 ? '' : 's'}`
}

function resetEmploymentForm() {
  employerName.value = ''
  employmentStart.value = null
  employmentEnd.value = null
  isOngoing.value = false
  editingId.value = null
}

function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    store.clearAllData()
    optStartDate.value = null
    optEndDate.value = null
    stemStartDate.value = null
    stemEndDate.value = null
    resetEmploymentForm()
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- OPT Period Section -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-3">OPT Period (Post-completion OPT)</h3>
      <p class="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 mb-3">
        Dates auto-fill based on typical OPT (1 year) and STEM (2 years) timelines.
        Please verify your EAD cards for exact dates.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseDatePicker
          v-model="optStartDate"
          label="Start Date"
          required
        />
        <BaseDatePicker
          v-model="optEndDate"
          label="End Date"
          required
        />
      </div>
    </div>

    <!-- STEM Extension Toggle -->
    <div>
      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          :checked="store.hasStemExtension"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          @change="(e) => store.toggleStemExtension((e.target as HTMLInputElement).checked)"
        />
        <span class="text-sm font-medium text-gray-700">
          I have a STEM OPT Extension
        </span>
      </label>
    </div>

    <!-- STEM Period Section (if enabled) -->
    <div v-if="store.hasStemExtension">
      <h3 class="text-lg font-medium text-gray-900 mb-3">STEM OPT Period</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseDatePicker
          v-model="stemStartDate"
          label="Start Date"
          required
        />
        <BaseDatePicker
          v-model="stemEndDate"
          label="End Date"
          required
        />
      </div>
    </div>

    <hr class="border-gray-200" />

    <!-- Employment History Section -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 mb-3">Employment History</h3>

      <!-- Add/Edit Employment Form -->
      <div class="glass-card bg-white/70 border border-white/40 p-4 mb-4">
        <div class="space-y-3">
          <BaseInput
            v-model="employerName"
            label="Employer Name"
            type="text"
            placeholder="e.g., Acme Corporation"
            required
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BaseDatePicker
              v-model="employmentStart"
              label="Start Date"
              required
            />
            <BaseDatePicker
              v-model="employmentEnd"
              label="End Date"
              :disabled="isOngoing"
              :required="!isOngoing"
            />
          </div>

          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              v-model="isOngoing"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span class="text-sm text-gray-700">This is my current job (ongoing)</span>
          </label>

          <div class="flex space-x-2">
            <BaseButton
              :disabled="!formValid"
              @click="addEmployment"
            >
              {{ isEditing ? 'Update' : 'Add' }} Employment
            </BaseButton>
            <BaseButton
              v-if="isEditing"
              variant="secondary"
              @click="resetEmploymentForm"
            >
              Cancel
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Employment List -->
      <div v-if="store.employmentSpans.length > 0" class="space-y-2">
        <div
          v-for="span in store.employmentSpans"
          :key="span.id"
          class="bg-white border border-gray-200 rounded-md p-3 flex items-center justify-between"
        >
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ span.employerName }}</p>
            <p class="text-sm text-gray-600">
              <span>
                {{ formatDateDisplay(span.startDate) }} -
                {{ span.endDate ? formatDateDisplay(span.endDate) : 'Today' }}
              </span>
              <span class="ml-2 text-xs text-gray-500">
                ({{ getEmploymentDuration(span) }})
              </span>
            </p>
          </div>
          <div class="flex space-x-2">
            <button
              class="text-primary-600 hover:text-primary-700 text-sm font-medium"
              @click="editEmployment(span)"
            >
              Edit
            </button>
            <button
              class="text-red-600 hover:text-red-700 text-sm font-medium"
              @click="deleteEmployment(span.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <p v-else class="text-sm text-gray-500 text-center py-4">
        No employment records added yet. Add your first employment above.
      </p>
    </div>

    <!-- Clear All Button -->
    <div v-if="store.hasData" class="pt-4 border-t border-gray-200">
      <BaseButton
        variant="danger"
        size="sm"
        @click="clearAllData"
      >
        Clear All Data
      </BaseButton>
    </div>
  </div>
</template>
