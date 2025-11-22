<script setup lang="ts">
import { toRefs } from 'vue'
interface Props {
  type?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  dismissible?: boolean
}

interface Emits {
  (e: 'dismiss'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  dismissible: false,
})

const { type, title, dismissible } = toRefs(props)

const emit = defineEmits<Emits>()

const typeStyles = {
  success: {
    container: 'bg-green-50 border-green-200',
    title: 'text-green-800',
    text: 'text-green-700',
    icon: 'text-green-400',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
    icon: 'text-yellow-400',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    title: 'text-red-800',
    text: 'text-red-700',
    icon: 'text-red-400',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    title: 'text-blue-800',
    text: 'text-blue-700',
    icon: 'text-blue-400',
  },
}

const icons = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

function handleDismiss() {
  emit('dismiss')
}
</script>

<template>
  <div
    :class="[
      'rounded-md border p-4',
      typeStyles[type].container,
    ]"
    role="alert"
  >
    <div class="flex">
      <div class="flex-shrink-0">
        <svg
          :class="['h-5 w-5', typeStyles[type].icon]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            :d="icons[type]"
          />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <h3
          v-if="title"
          :class="['text-sm font-medium', typeStyles[type].title]"
        >
          {{ title }}
        </h3>
        <div :class="['text-sm', typeStyles[type].text]">
          <slot />
        </div>
      </div>
      <div v-if="dismissible" class="ml-auto pl-3">
        <button
          type="button"
          :class="[
            'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
            typeStyles[type].text,
          ]"
          @click="handleDismiss"
        >
          <span class="sr-only">Dismiss</span>
          <svg
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
