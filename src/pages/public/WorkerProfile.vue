<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorkerById } from '@/services/workers.api'
import RichTextContent from '@/components/common/RichTextContent.vue'
import ContactRevealFields from '@/components/common/ContactRevealFields.vue'
import { resolveUploadUrl } from '@/utils/mediaUrl'

const route = useRoute()
const router = useRouter()

const worker = ref(null)
const loading = ref(false)

const fetchWorkerProfile = async () => {
  try {
    loading.value = true
    // route.params.id must be workers.id (not users.id)
    const response = await getWorkerById(route.params.id)
    worker.value = response.data
  } catch (error) {
    console.error('Failed to fetch worker profile:', error)
    worker.value = null
  } finally {
    loading.value = false
  }
}

const avatarSrc = computed(() => resolveUploadUrl(worker.value?.avatar_url))


const formatCurrency = (amount, currencyObj) => {
  if (!amount) return '0'
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  
  if (currencyObj?.symbol) {
    return `${currencyObj.symbol}${formatted}`
  }
  return formatted
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}

function resolveTelegramChatUrl(w) {
  if (!w) return null
  if (w.telegram_chat_url) return w.telegram_chat_url
  const username = String(w.telegram_username || '')
    .replace(/^@/, '')
    .trim()
  if (username) return `https://t.me/${username}`
  return null
}

const canChatTelegram = computed(() => !!resolveTelegramChatUrl(worker.value))

function openTelegramChat() {
  const url = resolveTelegramChatUrl(worker.value)
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(fetchWorkerProfile)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-linear-to-r from-blue-600 to-indigo-700 text-white py-8">
      <div class="max-w-6xl mx-auto px-6">
        <button
          @click="router.back()"
          class="text-sm text-white/80 hover:text-white mb-4 flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {{ $t('workerProfile.back') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="worker" class="max-w-6xl mx-auto px-6 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Profile Card -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex flex-col items-center text-center">
              <div class="w-32 h-32 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden mb-4 shadow-lg">
                <img
                  v-if="avatarSrc"
                  :src="avatarSrc"
                  class="w-full h-full object-cover"
                  :alt="worker.name"
                />
                <span v-else class="text-4xl font-bold text-white">
                  {{ worker.name?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              
              <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ worker.name }}</h1>
              
              <RichTextContent
                v-if="worker.profile_summary"
                :html="worker.profile_summary"
                class="text-sm mb-4"
              />

              <!-- Contact Info (masked + click-to-reveal) -->
              <div class="w-full space-y-3 text-sm text-left border-t pt-4">
                <ContactRevealFields :worker="worker" />

                <div v-if="worker.country_name" class="flex items-center gap-2 text-gray-600">
                  <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                  <span>{{ worker.country_name }}</span>
                </div>

                <div v-if="worker.gender_name" class="flex items-center gap-2 text-gray-600">
                  <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>{{ worker.gender_name }}</span>
                </div>

                <!-- Telegram (recruiter view of GET /workers/:id) -->
                <div
                  v-if="worker.telegram_available || worker.telegram_username || worker.telegram_display_name"
                  class="flex items-start gap-2 text-gray-600"
                >
                  <svg class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span>
                    {{ worker.telegram_display_name || (worker.telegram_username ? `@${worker.telegram_username}` : $t('contactActions.telegram')) }}
                    <span
                      v-if="worker.telegram_display_name && worker.telegram_username"
                      class="text-gray-400"
                    >
                      (@{{ worker.telegram_username }})
                    </span>
                  </span>
                </div>

                <div v-if="canChatTelegram" class="pt-3 border-t mt-4">
                  <button
                    type="button"
                    class="flex items-center justify-center gap-2 w-full text-[#229ED9] hover:text-[#1b8bc0] hover:bg-sky-50 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-sky-200"
                    @click="openTelegramChat"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    {{ $t('contactActions.telegram') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Salary Information -->
          <div v-if="worker.expected_salary || worker.current_salary" class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ $t('workerProfile.salaryInformation') }}
            </h3>
            
            <div class="space-y-3">
              <div v-if="worker.expected_salary">
                <div class="text-sm text-gray-600 mb-1">{{ $t('workerProfile.expectedSalary') }}</div>
                <p class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(worker.expected_salary, worker.expected_salary_currency) }}
                </p>
                <p v-if="worker.expected_salary_currency" class="text-xs text-gray-500 mt-1">
                  {{ worker.expected_salary_currency.name }} ({{ worker.expected_salary_currency.code }})
                </p>
              </div>
              
              <div v-if="worker.current_salary" class="pt-3 border-t border-gray-200">
                <div class="text-sm text-gray-600 mb-1">{{ $t('workerProfile.currentSalary') }}</div>
                <p class="text-xl font-semibold text-gray-700">
                  {{ formatCurrency(worker.current_salary, worker.current_salary_currency) }}
                </p>
                <p v-if="worker.current_salary_currency" class="text-xs text-gray-500 mt-1">
                  {{ worker.current_salary_currency.name }} ({{ worker.current_salary_currency.code }})
                </p>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div v-if="worker.skills && worker.skills.length" class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              {{ $t('workerProfile.skills') }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="skill in worker.skills"
                :key="skill.id"
                class="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
              >
                {{ skill.skill_name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Work Experience -->
          <div v-if="worker.work_experiences && worker.work_experiences.length" class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              {{ $t('workerProfile.workExperience') }}
            </h3>
            
            <div class="space-y-6">
              <div
                v-for="exp in worker.work_experiences"
                :key="exp.id"
                class="border-l-4 border-blue-500 pl-4"
              >
                <h4 class="font-semibold text-gray-900">{{ exp.job_title }}</h4>
                <p class="text-blue-600 font-medium">{{ exp.company_name }}</p>
                <p class="text-sm text-gray-500 mb-2">
                  {{ formatDate(exp.start_date) }} - 
                  {{ exp.is_current ? $t('workerProfile.present') : formatDate(exp.end_date) }}
                </p>
                <RichTextContent
                  v-if="exp.description"
                  :html="exp.description"
                  class="text-gray-700"
                />
              </div>
            </div>
          </div>

          <!-- Education -->
          <div v-if="worker.educations && worker.educations.length" class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
              {{ $t('workerProfile.education') }}
            </h3>
            
            <div class="space-y-6">
              <div
                v-for="edu in worker.educations"
                :key="edu.id"
                class="border-l-4 border-purple-500 pl-4"
              >
                <h4 class="font-semibold text-gray-900">{{ edu.degree }}</h4>
                <p class="text-purple-600 font-medium">{{ edu.institution_name }}</p>
                <p v-if="edu.major" class="text-sm text-gray-600">{{ edu.major }}</p>
                <p class="text-sm text-gray-500 mb-2">
                  {{ formatDate(edu.start_date) }} - 
                  {{ edu.is_current ? $t('workerProfile.present') : formatDate(edu.end_date) }}
                </p>
                <RichTextContent
                  v-if="edu.description"
                  :html="edu.description"
                  class="text-gray-700"
                />
              </div>
            </div>
          </div>

          <!-- Certifications -->
          <div v-if="worker.certifications && worker.certifications.length" class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              {{ $t('workerProfile.certifications') }}
            </h3>
            
            <div class="space-y-4">
              <div
                v-for="cert in worker.certifications"
                :key="cert.id"
                class="border border-gray-200 rounded-lg p-4"
              >
                <h4 class="font-semibold text-gray-900">{{ cert.certification_name }}</h4>
                <p class="text-blue-600 text-sm font-medium">{{ cert.issuing_organization }}</p>
                <p class="text-sm text-gray-500 mt-1">
                  {{ $t('workerProfile.issued') }}: {{ formatDate(cert.issue_date) }}
                  <span v-if="cert.expiry_date"> • {{ $t('workerProfile.expires') }}: {{ formatDate(cert.expiry_date) }}</span>
                </p>
                <div v-if="cert.credential_id || cert.credential_url" class="mt-2 space-y-1">
                  <p v-if="cert.credential_id" class="text-xs text-gray-600">
                    {{ $t('workerProfile.credentialId') }}: {{ cert.credential_id }}
                  </p>
                  <a
                    v-if="cert.credential_url"
                    :href="cert.credential_url"
                    target="_blank"
                    class="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {{ $t('workerProfile.viewCredential') }}
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found State -->
    <div v-else-if="!loading" class="max-w-2xl mx-auto px-6 py-16 text-center">
      <svg class="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ $t('workerProfile.notFound') }}</h2>
      <p class="text-gray-600 mb-6">{{ $t('workerProfile.notFoundMessage') }}</p>
      <button
        @click="router.back()"
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
      >
        {{ $t('workerProfile.goBack') }}
      </button>
    </div>
  </div>
</template>
