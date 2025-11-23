<script setup lang="ts">
import { format } from 'date-fns'
import { computed, onMounted, ref } from 'vue'
import BaseButton from './components/base/BaseButton.vue'
import BaseModal from './components/base/BaseModal.vue'
import InputForm from './components/InputForm.vue'
import ResultSummary from './components/ResultSummary.vue'
import Timeline from './components/Timeline.vue'
import { useAppStore } from './stores/app'
import { createUnemploymentICS, downloadIcsFile } from './utils/ics'

const store = useAppStore()
const showHelpModal = ref(false)
type ToastType = 'success' | 'error'
const copyStatus = ref<'idle' | 'copied' | 'error'>('idle')
const exportStatus = ref<'idle' | 'success' | 'error'>('idle')
const toasts = ref<{ id: number; message: string; type: ToastType }[]>([])
let tempTimer: number | null = null

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

function pushToast(message: string, type: ToastType = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }, 4000)
}

async function copySummary() {
  if (!store.optPeriod) return
  if (tempTimer) {
    clearTimeout(tempTimer)
    tempTimer = null
  }
  try {
    if (navigator && navigator.clipboard) {
      await navigator.clipboard.writeText(summaryText.value)
      copyStatus.value = 'copied'
      pushToast('Summary copied to clipboard', 'success')
    } else {
      throw new Error('Clipboard API unavailable')
    }
  } catch (error) {
    console.error('Failed to copy summary', error)
    copyStatus.value = 'error'
    pushToast('Failed to copy summary', 'error')
  } finally {
    tempTimer = window.setTimeout(() => {
      copyStatus.value = 'idle'
    }, 3000)
  }
}

async function exportDeadlines() {
  if (!store.optPeriod) return
  if (tempTimer) {
    clearTimeout(tempTimer)
    tempTimer = null
  }
  try {
    const ics = createUnemploymentICS(store.optPeriod, store.stemPeriod)
    if (!ics) throw new Error('Missing OPT period')
    downloadIcsFile(ics, 'opt-stem-deadlines.ics')
    exportStatus.value = 'success'
    pushToast('ICS download created', 'success')
  } catch (error) {
    console.error('Failed to export ICS', error)
    exportStatus.value = 'error'
    pushToast('Failed to export ICS file', 'error')
  } finally {
    tempTimer = window.setTimeout(() => {
      exportStatus.value = 'idle'
    }, 3000)
  }
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-sky-50 via-pink-50 to-amber-50">
    <div class="pointer-events-none absolute inset-0 opacity-70">
      <div class="absolute -top-24 -left-16 w-80 h-80 bg-pink-200/60 rounded-[40%] blur-3xl rotate-6"></div>
      <div class="absolute top-16 -right-20 w-96 h-96 bg-blue-200/40 rounded-[35%] blur-3xl -rotate-12"></div>
      <div class="absolute bottom-0 left-1/4 w-72 h-72 bg-amber-200/40 rounded-full blur-[120px]"></div>
    </div>
    <!-- Header -->
    <header class="relative z-10">
      <div class="container-custom py-10">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span class="fun-pill bg-white/70 text-sky-700 shadow">Made for students</span>
            <span class="fun-pill bg-white/70 text-amber-600 shadow mt-2 inline-block">In Beta</span>
            <h1 class="text-4xl md:text-5xl font-black text-slate-900 mt-3 drop-shadow-sm">
              Track US
            </h1>
            <p class="mt-2 text-sm text-gray-600 max-w-xl">
              Track your unemployment days for F-1 OPT and STEM OPT (for now)
            </p>
            <p class="mt-1 text-sm text-gray-600 max-w-xl">
              I am open to contributions! Check out the GitHub repo.
            </p>
            <p class="mt-1 text-s text-gray-500 max-w-xl">
              Want a feature? <a href="https://github.com/adiagarwalrock/track-us/issues" target="_blank"
                rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700 font-semibold">Open a GitHub
                issue</a> so I can track it.
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <a href="https://github.com/adiagarwalrock/track-us" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700">
              <svg class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path
                  d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77 5.44 5.44 0 0 0 3.5 8.5c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              View on GitHub
            </a>
            <BaseButton variant="secondary" size="sm" @click="showHelpModal = true">
              <svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </BaseButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container-custom py-12 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Input Form -->
        <div>
          <div class="glass-card p-6">
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
          <div class="glass-card p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">
                Unemployment Summary
              </h2>
              <div class="flex items-center space-x-2">
                <BaseButton variant="secondary" size="sm" :disabled="!store.canCalculate || !store.optPeriod"
                  @click="exportDeadlines">
                  📆 Add to Calendar
                </BaseButton>
              </div>
            </div>

            <ResultSummary />
          </div>

          <!-- Timeline -->
          <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900">
                Employment Timeline
              </h2>
              <BaseButton variant="secondary" size="sm" :disabled="!store.canCalculate || !store.optPeriod"
                @click="copySummary">
                Copy Summary
              </BaseButton>
            </div>

            <Timeline />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center text-sm text-gray-600">
        <p class="font-medium text-yellow-700 bg-white/70 border border-yellow-200 rounded-md p-3 inline-block shadow">
          ⚠️ This tool is for reference purposes only. Always consult your
          international student office for official guidance.
        </p>
        <p class="mt-4 text-xs text-gray-500">
          I do not store any dates or personal information — everything stays in your browser.
        </p>
      </div>
    </main>

    <!-- Toast Notifications -->
    <div class="fixed bottom-4 left-4 space-y-2 z-50">
      <div v-for="toast in toasts" :key="toast.id" :class="[
          'px-4 py-3 rounded shadow text-sm text-white',
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600',
]">
        {{ toast.message }}
      </div>
    </div>

    <!-- Help Modal -->
    <BaseModal v-model="showHelpModal" title="How to Use This Tool" size="lg">
      <div class="space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <p class="text-xs font-semibold tracking-wide text-sky-600 uppercase">About OPT unemployment limits</p>
          <article class="mt-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-[13px] shadow-sm">
            <p class="text-slate-600">
              F-1 students on post-completion OPT must monitor unemployment carefully:
            </p>
            <dl class="mt-3 grid gap-2 text-slate-700 font-semibold">
              <div class="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow">
                <dt>Post-Completion OPT</dt>
                <dd>90-day unemployment limit</dd>
              </div>
              <div class="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow">
                <dt>STEM OPT Extension</dt>
                <dd>60-day unemployment limit</dd>
              </div>
              <div class="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow">
                <dt>Total (OPT + STEM)</dt>
                <dd>150-day unemployment limit</dd>
              </div>
            </dl>
          </article>
        </section>

        <section>
          <p class="text-xs font-semibold tracking-wide text-sky-600 uppercase">How to use</p>
          <article
            class="mt-2 rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 px-4 py-3 shadow">
            <ol class="space-y-2 text-slate-700 list-decimal list-inside">
              <li>Enter your OPT EAD start and end dates.</li>
              <li>Add STEM dates if you hold the extension.</li>
              <li>Log each employment period (employers, start/end dates).</li>
              <li>Review the summary to see days used vs. remaining.</li>
              <li>Download ICS reminders or copy the summary for your DSO.</li>
            </ol>
          </article>
        </section>

        <section>
          <p class="text-xs font-semibold tracking-wide text-sky-600 uppercase">Important notes</p>
          <article
            class="mt-2 rounded-2xl border border-yellow-100 bg-yellow-50/60 px-4 py-3 text-[13px] text-yellow-900 shadow">
            <ul class="space-y-1">
              <li>All data stays in your browser—nothing is uploaded.</li>
              <li>Employment dates outside your EAD period are auto-adjusted.</li>
              <li>Overlapping jobs are merged automatically.</li>
              <li>“Ongoing” jobs count up to today.</li>
            </ul>
          </article>
        </section>

        <section class="grid gap-3 md:grid-cols-2">
          <article class="rounded-xl bg-slate-900 text-slate-100 px-4 py-3 shadow-lg shadow-slate-900/30">
            <p class="text-xs uppercase tracking-wide text-slate-300">Official resources</p>
            <a href="https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students"
              target="_blank" rel="noopener noreferrer"
              class="mt-1 inline-flex items-center font-semibold text-sky-200 hover:text-white">
              USCIS OPT Information
            </a>
          </article>

          <article class="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <p class="text-xs uppercase tracking-wide text-slate-500">Community help</p>
            <ul class="mt-2 space-y-1 text-sky-600 font-medium">
              <li>
                <a href="https://www.reddit.com/r/USCIS/" target="_blank" rel="noopener noreferrer">
                  r/USCIS on Reddit
                </a>
              </li>
              <li>
                <a href="https://www.reddit.com/r/F1Visa/" target="_blank" rel="noopener noreferrer"
                  class="text-primary-600 hover:text-primary-700">
                  r/F1Visa on Reddit
                </a>
              </li>
            </ul>
          </article>
        </section>
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
