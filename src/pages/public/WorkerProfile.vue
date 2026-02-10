<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorkerById } from '@/services/workers.api'

const route = useRoute()
const router = useRouter()

const worker = ref(null)
const loading = ref(false)

const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || ''

const fetchWorkerProfile = async () => {
  try {
    loading.value = true
    const response = await getWorkerById(route.params.id)
    worker.value = response.data
  } catch (error) {
    console.error('Failed to fetch worker profile:', error)
  } finally {
    loading.value = false
  }
}

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
                  v-if="worker.avatar_url"
                  :src="`${linkStorageUrl}${worker.avatar_url}`"
                  class="w-full h-full object-cover"
                  :alt="worker.name"
                />
                <span v-else class="text-4xl font-bold text-white">
                  {{ worker.name?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              
              <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ worker.name }}</h1>
              
              <div v-if="worker.profile_summary" class="text-sm text-gray-600 mb-4">
                {{ worker.profile_summary }}
              </div>

              <!-- Contact Info -->
              <div class="w-full space-y-3 text-sm text-left border-t pt-4">
                <div v-if="worker.email" class="flex items-center gap-2 text-gray-600">
                  <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span class="break-all">{{ worker.email }}</span>
                </div>
                
                <div v-if="worker.telephone" class="flex items-center gap-2 text-gray-600">
                  <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>{{ worker.telephone }}</span>
                </div>

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

                <!-- Contact Buttons -->
                <div v-if="worker.email || worker.telephone" class="flex justify-around flex-wrap items-center gap-3 pt-3 border-t mt-4">
                  <a
                    v-if="worker.telephone"
                    :href="`tel:${worker.telephone}`"
                    class="flex items-center justify-center gap-2 flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-orange-200 min-w-fit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    {{ $t('contactActions.call') }}
                  </a>

                  <a
                    v-if="worker.email"
                    :href="`mailto:${worker.email}`"
                    class="flex items-center justify-center gap-2 flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-blue-200 min-w-fit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    {{ $t('contactActions.email') }}
                  </a>

                  <a
                    v-if="worker.telephone"
                    :href="`https://wa.me/${worker.telephone.replace(/\D/g, '')}`"
                    target="_blank"
                    class="flex items-center justify-center gap-2 flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-green-200 min-w-fit"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.006a9.87 9.87 0 00-5.031 1.378c-3.055 2.013-5.555 5.169-5.555 8.426 0 5.668 4.616 10.282 10.282 10.282 1.693 0 3.351-.397 4.906-1.158l3.537 1.237-1.297-4.41c.895-1.624 1.414-3.508 1.414-5.524 0-5.668-4.616-10.282-10.282-10.282"/>
                    </svg>
                    {{ $t('contactActions.whatsapp') }}
                  </a>
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
                <p v-if="exp.description" class="text-gray-700 whitespace-pre-line">
                  {{ exp.description }}
                </p>
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
                <p v-if="edu.description" class="text-gray-700 whitespace-pre-line">
                  {{ edu.description }}
                </p>
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
