<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseButton from './components/base/BaseButton.vue'
import BaseModal from './components/base/BaseModal.vue'
import InputForm from './components/InputForm.vue'
import ResultSummary from './components/ResultSummary.vue'
import Timeline from './components/Timeline.vue'
import { useAppStore } from './stores/app'
import { format } from 'date-fns'

const store = useAppStore()
const showHelpModal = ref(false)
const copyStatus = ref<'idle' | 'copied' | 'error'>('idle')
let copyTimeout: number | null = null

onMounted(() => {
  // Load saved state from localStorage
  store.hydrateFromStorage()
})

function formatDate(date: Date | null | undefined): string {
  return date ? format(date, 'MMM d, yyyy') : 'N/A'
}

const summaryText = computed(() => {
  const sections: string[] = []

  if (store.optPeriod) {
    sections.push(
      `OPT Period: ${formatDate(store.optPeriod.startDate)} - ${formatDate(store.optPeriod.endDate)}`
    )
  } else {
    sections.push('OPT Period: Not set')
  }

  if (store.hasStemExtension && store.stemPeriod) {
    sections.push(
      `STEM Period: ${formatDate(store.stemPeriod.startDate)} - ${formatDate(store.stemPeriod.endDate)}`
    )
  }

  if (store.employmentSpans.length > 0) {
    const jobs = store.employmentSpans
      .slice()
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .map((span, index) => {
        return `${index + 1}. ${span.employerName}: ${formatDate(span.startDate)} - ${span.endDate ? formatDate(span.endDate) : 'Ongoing'}`
      })
    sections.push(`Employment History:\n${jobs.join('\n')}`)
  } else {
    sections.push('Employment History: None added')
  }

  if (store.calculationResult) {
    const result = store.calculationResult
    sections.push(
      `Totals:\n- Total Used: ${result.totalUsedDays} days\n- Total Allowed: ${result.totalAllowedDays} days\n- Status: ${result.status.toUpperCase()}`
    )
  } else {
    sections.push('Totals: Not calculated yet (enter OPT dates to begin).')
  }

  return sections.join('\n\n')
})

async function copySummary() {
  if (!store.optPeriod) return
  if (copyTimeout) {
    clearTimeout(copyTimeout)
    copyTimeout = null
  }
  try {
    if (navigator && navigator.clipboard) {
      await navigator.clipboard.writeText(summaryText.value)
      copyStatus.value = 'copied'
    } else {
      throw new Error('Clipboard API unavailable')
    }
  } catch (error) {
    console.error('Failed to copy summary', error)
    copyStatus.value = 'error'
  } finally {
    copyTimeout = window.setTimeout(() => {
      copyStatus.value = 'idle'
    }, 3000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="container-custom py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Unemployment Tracker
            </h1>
            <p class="mt-1 text-sm text-gray-600">
              Track your unemployment days for F-1 OPT and STEM OPT (for now)
            </p>
            <p class="mt-1 text-sm text-gray-600">
              I am open to contributions! Check out the GitHub repo.
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <a
              href="https://github.com/adiagarwalrock/tracker"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              <svg
                class="w-4 h-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77 5.44 5.44 0 0 0 3.5 8.5c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                />
              </svg>
              View on GitHub
            </a>
            <BaseButton
              variant="secondary"
              size="sm"
              @click="showHelpModal = true"
            >
              <svg
                class="w-5 h-5 inline-block mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Help
            </BaseButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container-custom py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Input Form -->
        <div>
          <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              Enter Your Information
            </h2>
            <p class="text-sm text-gray-600 mb-6">
              Provide your EAD dates and employment history to calculate your
              unemployment days.
            </p>

            <InputForm />
          </div>
        </div>

        <!-- Right Column: Results & Timeline -->
        <div class="space-y-6">
          <!-- Results Summary -->
          <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">
                Unemployment Summary
              </h2>
              <div class="flex items-center space-x-2">
                <BaseButton
                  variant="secondary"
                  size="sm"
                  :disabled="!store.canCalculate || !store.optPeriod"
                  @click="copySummary"
                >
                  Copy Summary
                </BaseButton>
                <span
                  v-if="copyStatus !== 'idle'"
                  :class="[
                    'text-xs font-medium',
                    copyStatus === 'copied' ? 'text-green-600' : 'text-red-600',
                  ]"
                >
                  {{ copyStatus === 'copied' ? 'Copied!' : 'Copy failed' }}
                </span>
              </div>
            </div>

            <ResultSummary />
          </div>

          <!-- Timeline -->
          <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              Employment Timeline
            </h2>

            <Timeline />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center text-sm text-gray-600">
        <p class="font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-3 inline-block">
          ⚠️ This tool is for reference purposes only. Always consult your
          international student office for official guidance.
        </p>
        <p class="mt-4 text-xs text-gray-500">
          I do not store any dates or personal information — everything stays in your browser.
        </p>
      </div>
    </main>

    <!-- Help Modal -->
    <BaseModal
      v-model="showHelpModal"
      title="How to Use This Tool"
      size="lg"
    >
      <div class="prose prose-sm max-w-none">
        <h4>About OPT Unemployment Limits</h4>
        <p>
          F-1 students on post-completion Optional Practical Training (OPT)
          must comply with unemployment day limits to maintain status:
        </p>
        <ul>
          <li>
            <strong>Post-Completion OPT:</strong> 90 days maximum during the
            entire OPT period
          </li>
          <li>
            <strong>STEM OPT Extension:</strong> 150 days maximum total
            (including any unemployment from the initial OPT period)
          </li>
        </ul>

        <h4>How to Use</h4>
        <ol>
          <li>Enter your EAD start and end dates for your OPT period</li>
          <li>
            If you have a STEM extension, toggle it on and enter those dates
          </li>
          <li>
            Add all your employment periods (you can add multiple employers)
          </li>
          <li>The tool will automatically calculate your unemployment days</li>
          <li>Review the status and warnings to ensure compliance</li>
        </ol>

        <h4>Important Notes</h4>
        <ul>
          <li>
            Your data is stored locally in your browser - we don't send it
            anywhere
          </li>
          <li>
            Employment dates outside your EAD period are automatically adjusted
          </li>
          <li>Overlapping employment periods are merged automatically</li>
          <li>
            "Ongoing" employment is calculated up to today's date
          </li>
        </ul>

        <h4>Official Resources</h4>
        <p>
          For official information, visit:
          <a
            href="https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 hover:text-primary-700"
          >
            USCIS OPT Information
          </a>
        </p>

        <h4>Community Help</h4>
        <p>
          Talk with other students navigating OPT and STEM extensions:
        </p>
        <ul>
          <li>
            <a
              href="https://www.reddit.com/r/USCIS/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 hover:text-primary-700"
            >
              r/USCIS on Reddit
            </a>
          </li>
          <li>
            <a
              href="https://www.reddit.com/r/OPT/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary-600 hover:text-primary-700"
            >
              r/OPT on Reddit
            </a>
          </li>
        </ul>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <BaseButton @click="showHelpModal = false">
            Got it
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
