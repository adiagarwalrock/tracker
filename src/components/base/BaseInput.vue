<script setup lang="ts">
import { computed } from 'vue'
interface Props {
  modelValue: string | number | Date | null
  label?: string
  type?: 'text' | 'date' | 'number' | 'email'
  placeholder?: string
  error?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | number | Date | null): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
})

const placeholderText = computed<string>(() => props.placeholder ?? '')

const emit = defineEmits<Emits>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value: string | number | Date | null = target.value

  if (props.type === 'number') {
    value = target.value ? Number(target.value) : null
  } else if (props.type === 'date') {
    value = target.value ? new Date(target.value) : null
  }

  emit('update:modelValue', value)
}

function formatValue(): string {
  if (!props.modelValue) return ''

  if (props.type === 'date' && props.modelValue instanceof Date) {
    const iso = props.modelValue.toISOString().split('T')[0]
    return iso ?? ''
  }

  return String(props.modelValue)
}
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <input
      :type="type"
      :value="formatValue()"
      :placeholder="placeholderText"
      :disabled="disabled"
      :required="required"
      :class="[
        'block w-full rounded-md shadow-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        error
          ? 'border-red-300 text-red-900 placeholder-red-300'
          : 'border-gray-300',
        'px-3 py-2',
      ]"
      @input="handleInput"
    />

    <p v-if="helpText && !error" class="mt-1 text-sm text-gray-500">
      {{ helpText }}
    </p>

    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
