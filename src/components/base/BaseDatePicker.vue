<script setup lang="ts">
import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Props {
  modelValue: Date | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  helpText?: string
  error?: string
  min?: Date
  max?: Date
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select date',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date | null): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const displayMonth = ref<Date>(props.modelValue ? props.modelValue : new Date())

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const selectedMonth = ref(displayMonth.value.getMonth())
const selectedYear = ref(displayMonth.value.getFullYear())

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      displayMonth.value = val
    }
  }
)

watch(displayMonth, (val) => {
  selectedMonth.value = val.getMonth()
  selectedYear.value = val.getFullYear()
})

watch(
  [selectedMonth, selectedYear],
  ([month, year]) => {
    if (!Number.isFinite(year)) return
    const newDate = startOfMonth(new Date(year, month, 1))
    if (Math.abs(newDate.getTime() - displayMonth.value.getTime()) > 1000) {
      displayMonth.value = newDate
    }
  }
)

const formattedValue = computed(() => {
  return props.modelValue ? format(props.modelValue, 'MMM d, yyyy') : ''
})

const selectedDate = computed(() => {
  return props.modelValue ? startOfDay(props.modelValue) : null
})

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(displayMonth.value), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(displayMonth.value), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start, end })
  const weeks: Date[][] = []

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return weeks
})

function toggleOpen() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closePicker() {
  isOpen.value = false
}

function selectDate(day: Date) {
  if (props.disabled || isDayDisabled(day)) return
  emit('update:modelValue', startOfDay(day))
  displayMonth.value = startOfDay(day)
  closePicker()
}

function clearDate() {
  emit('update:modelValue', null)
  closePicker()
}

function goToToday() {
  const today = startOfDay(new Date())
  displayMonth.value = today
  emit('update:modelValue', today)
  closePicker()
}

function goToPreviousMonth() {
  displayMonth.value = addMonths(displayMonth.value, -1)
}

function goToNextMonth() {
  displayMonth.value = addMonths(displayMonth.value, 1)
}

function goToPreviousYear() {
  displayMonth.value = addYears(displayMonth.value, -1)
}

function goToNextYear() {
  displayMonth.value = addYears(displayMonth.value, 1)
}

function isDayDisabled(day: Date): boolean {
  if (props.min && isBefore(day, startOfDay(props.min))) return true
  if (props.max && isAfter(day, startOfDay(props.max))) return true
  return false
}

function handleClickOutside(event: MouseEvent) {
  if (!containerRef.value) return
  if (!containerRef.value.contains(event.target as Node)) {
    closePicker()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePicker()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="containerRef" class="w-full relative">
    <label
      v-if="label"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div
      class="relative"
    >
      <button
        type="button"
        :disabled="disabled"
        class="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        @click="toggleOpen"
      >
        <span
          :class="[
            'text-left flex-1',
            formattedValue ? 'text-gray-900' : 'text-gray-500',
          ]"
        >
          {{ formattedValue || placeholder }}
        </span>
        <svg
          class="w-4 h-4 text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>

      <div
        v-if="isOpen"
        class="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3"
      >
        <div class="grid grid-cols-[auto,1fr,auto] gap-1 items-center mb-2">
          <div class="flex items-center space-x-0.5 text-xs">
            <button
              type="button"
              class="text-gray-500 hover:text-gray-700 p-1 rounded"
              @click="goToPreviousYear"
            >
              <span class="sr-only">Previous year</span>
              «
            </button>
            <button
              type="button"
              class="text-gray-500 hover:text-gray-700 p-1 rounded"
              @click="goToPreviousMonth"
            >
              <span class="sr-only">Previous month</span>
              ‹
            </button>
          </div>
          <div class="flex items-center space-x-1 justify-center">
            <select
              v-model.number="selectedMonth"
              class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-24"
            >
              <option v-for="(month, index) in months" :key="month" :value="index">
                {{ month }}
              </option>
            </select>
          <input
            v-model.number="selectedYear"
            type="number"
            class="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
          <div class="flex items-center space-x-0.5 text-xs justify-end">
            <button
              type="button"
              class="text-gray-500 hover:text-gray-700 p-1 rounded"
              @click="goToNextMonth"
            >
              <span class="sr-only">Next month</span>
              ›
            </button>
            <button
              type="button"
              class="text-gray-500 hover:text-gray-700 p-1 rounded"
              @click="goToNextYear"
            >
              <span class="sr-only">Next year</span>
              »
            </button>
          </div>
        </div>

        <div class="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-2">
          <span v-for="day in weekDays" :key="day">
            {{ day }}
          </span>
        </div>

        <div class="grid grid-cols-7 text-center gap-1">
          <template v-for="(week, index) in calendarDays" :key="index">
            <button
              v-for="day in week"
              :key="day.toISOString()"
              type="button"
              :disabled="isDayDisabled(day)"
              :class="[
                'w-8 h-8 rounded-full text-sm flex items-center justify-center',
                !isSameMonth(day, displayMonth) ? 'text-gray-400' : 'text-gray-900',
                selectedDate && isSameDay(day, selectedDate)
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'hover:bg-gray-100',
                isDayDisabled(day) ? 'text-gray-300 cursor-not-allowed hover:bg-transparent' : ''
              ]"
              @click="selectDate(day)"
            >
              {{ format(day, 'd') }}
            </button>
          </template>
        </div>

        <div class="flex justify-between mt-3 text-sm">
          <button
            type="button"
            class="text-primary-600 hover:text-primary-700 font-medium"
            @click="goToToday"
          >
            Today
          </button>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700"
            @click="clearDate"
          >
            Clear
          </button>
        </div>
      </div>
    </div>

    <p v-if="helpText && !error" class="mt-1 text-sm text-gray-500">
      {{ helpText }}
    </p>
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
