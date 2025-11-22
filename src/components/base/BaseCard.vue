<script setup lang="ts">
import { toRefs } from 'vue'
interface Props {
  title?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
})

const { title, padding } = toRefs(props)

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}
</script>

<template>
  <div
    :class="[
      'bg-white rounded-lg shadow-md border border-gray-200',
      paddingClasses[padding],
    ]"
  >
    <h2
      v-if="title"
      class="text-xl font-semibold text-gray-900 mb-4"
    >
      {{ title }}
    </h2>
    <slot />
  </div>
</template>
