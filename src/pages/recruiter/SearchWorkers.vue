<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-linear-to-r from-blue-600 to-blue-800 text-white py-8">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold mb-2">{{ $t('searchWorkers.title') }}</h1>
        <p class="text-blue-100">{{ $t('searchWorkers.subtitle') }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Filters Sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {{ $t('searchWorkers.filters') }}
            </h2>

            <div class="space-y-5">
              <!-- Search -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.searchName') }}</label>
                <input
                  v-model="filters.search"
                  type="text"
                  :placeholder="$t('searchWorkers.workerNamePlaceholder')"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Skills -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.skills') }}</label>
                
                <!-- Selected Skills Tags -->
                <div v-if="selectedSkills.length > 0" class="flex flex-wrap gap-1.5 mb-2">
                  <span
                    v-for="skill in selectedSkills"
                    :key="skill.id"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                  >
                    {{ skill.name || skill.skill_name }}
                    <button
                      @click.stop="removeSkill(skill.id)"
                      class="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                </div>
                
                <!-- Search Input -->
                <div class="relative skills-dropdown-container">
                  <input
                    v-model="skillSearchQuery"
                    type="text"
                    :placeholder="$t('searchWorkers.skillsPlaceholder')"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    @input="handleSkillSearch"
                    @click="toggleSkillsDropdown"
                  />
                  
                  <!-- Dropdown -->
                  <div
                    v-if="showSkillsDropdown && availableSkills.length > 0"
                    class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    <div
                      v-for="skill in availableSkills"
                      :key="skill.id"
                      @click="toggleSkill(skill)"
                      class="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                    >
                      <span>{{ skill.name || skill.skill_name }}</span>
                      <svg
                        v-if="isSkillSelected(skill.id)"
                        class="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <p v-if="skillsLoading" class="text-xs text-gray-500 mt-1">Loading skills...</p>
                </div>
              </div>

              <!-- Gender -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.gender') }}</label>
                <select
                  v-model="filters.gender"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{{ $t('searchWorkers.allGenders') }}</option>
                  <option value="male">{{ $t('searchWorkers.male') }}</option>
                  <option value="female">{{ $t('searchWorkers.female') }}</option>
                  <option value="other">{{ $t('searchWorkers.other') }}</option>
                </select>
              </div>

              <!-- Nationality -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.nationality') }}</label>
                <div class="relative nationality-dropdown-container">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="nationalitySearchQuery"
                      type="text"
                      placeholder="Search nationality..."
                      class="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      @focus=" toggleNationalityDropdown"
                      @input="handleNationalitySearch"
                    />
                    <button
                      v-if="filters.nationality"
                      @click.stop="clearNationality"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  
                  <!-- Dropdown -->
                  <div
                    v-if="showNationalityDropdown && filteredNationalities.length > 0"
                    class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    <div
                      v-for="nat in filteredNationalities"
                      :key="nat.id"
                      @click="selectNationality(nat)"
                      class="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                    >
                      <span>{{ nat.country_name }} ({{ nat.iso_alpha3 }})</span>
                      <svg
                        v-if="filters.nationality === nat.country_name"
                        class="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <p v-if="nationalitiesLoading" class="text-xs text-gray-500 mt-1">Loading...</p>
                </div>
              </div>

              <!-- Experience Years -->
              <!-- <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.minExperience') }}</label>
                <input
                  v-model.number="filters.experience_years"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div> -->

              <!-- Education Level -->
              <!-- <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.educationLevel') }}</label>
                <select
                  v-model="filters.education_level"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{{ $t('searchWorkers.allLevels') }}</option>
                  <option value="High School">{{ $t('searchWorkers.highSchool') }}</option>
                  <option value="Diploma">{{ $t('searchWorkers.diploma') }}</option>
                  <option value="Bachelor">{{ $t('searchWorkers.bachelor') }}</option>
                  <option value="Master">{{ $t('searchWorkers.master') }}</option>
                  <option value="Doctorate">{{ $t('searchWorkers.doctorate') }}</option>
                </select>
              </div> -->

              <!-- Salary Range -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.minSalary') }}</label>
                <input
                  v-model.number="filters.min_salary"
                  type="number"
                  placeholder="0"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.maxSalary') }}</label>
                <input
                  v-model.number="filters.max_salary"
                  type="number"
                  placeholder="0"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Sort By -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.sortBy') }}</label>
                <select
                  v-model="filters.sort_by"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at">{{ $t('searchWorkers.newest') }}</option>
                  <option value="name">{{ $t('searchWorkers.name') }}</option>
                  <option value="expected_salary">{{ $t('searchWorkers.salary') }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('searchWorkers.order') }}</label>
                <select
                  v-model="filters.sort_order"
                  class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">{{ $t('searchWorkers.descending') }}</option>
                  <option value="asc">{{ $t('searchWorkers.ascending') }}</option>
                </select>
              </div>

              <!-- Action Buttons -->
              <div class="space-y-2 pt-4 border-t">
                <button
                  @click="applyFilters"
                  :disabled="loading"
                  class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  <span v-if="loading" class="inline-flex items-center gap-2">
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ $t('searchWorkers.searching') }}
                  </span>
                  <span v-else>{{ $t('searchWorkers.search') }}</span>
                </button>
                <button
                  @click="resetFilters"
                  class="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                >
                  {{ $t('searchWorkers.reset') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="lg:col-span-3">
          <!-- Results Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900">
              {{ $t('searchWorkers.results') }} <span class="text-blue-600">({{ totalResults }})</span>
            </h2>
            <select
              v-model="filters.limit"
              @change="applyFilters"
              class="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="12">12 {{ $t('searchWorkers.perPage') }}</option>
              <option value="24">24 {{ $t('searchWorkers.perPage') }}</option>
              <option value="36">36 {{ $t('searchWorkers.perPage') }}</option>
            </select>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="i in 6" :key="i" class="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div class="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>

          <!-- Workers Grid -->
          <div v-else-if="workers.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="worker in workers"
              :key="worker.id"
              @click="viewWorkerDetail(worker.id)"
              class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden border border-gray-200 hover:border-blue-300 flex flex-col"
            >
              <!-- Header -->
              <div class="bg-linear-to-r from-blue-50 to-indigo-50 p-4">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      <img
                        v-if="worker.avatar_url"
                        :src="`http://localhost:5000${worker.avatar_url}`"
                        :alt="worker.name"
                        class="w-full h-full object-cover"
                      />
                      <svg
                        v-else
                        class="w-8 h-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-gray-900">{{ worker.name }}</h3>
                      <div class="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{{ worker.country_name  ?? "Not Provided"}}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    v-if="worker.gender_name"
                    class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-800"
                  >
                    {{ worker.gender_name }}
                  </span>
                </div>
              </div>

              <!-- Content -->
              <div class="p-4 space-y-3 flex-1 flex flex-col">
                <!-- Profile Summary -->
                <p v-if="worker.profile_summary" class="text-sm text-gray-600 line-clamp-2">
                  {{ worker.profile_summary }}
                </p>

                <!-- Compact Info Grid -->
                <div class="space-y-2 text-sm">
                  <!-- Salary -->
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">{{ $t('searchWorkers.expectedSalary') }}</span>
                    <span class="font-bold text-green-600">{{ formatCurrency(worker.expected_salary, worker.expected_salary_currency) }}</span>
                  </div>

                  <!-- Experience Count -->
                  <div v-if="worker.work_experiences && worker.work_experiences.length > 0" class="flex items-center justify-between">
                    <span class="text-gray-600">{{ $t('searchWorkers.experience') }}</span>
                    <span class="text-gray-900 font-medium">{{ worker.work_experiences.length }} {{ worker.work_experiences.length > 1 ? $t('searchWorkers.positions') : $t('searchWorkers.position') }}</span>
                  </div>

                  <!-- Education Level -->
                  <div v-if="worker.educations && worker.educations.length > 0" class="flex items-center justify-between">
                    <span class="text-gray-600">{{ $t('searchWorkers.education') }}</span>
                    <span class="text-gray-900 font-medium">{{ worker.educations[0].degree }}</span>
                  </div>
                </div>

                <!-- Skills Preview -->
                <div v-if="worker.skills && worker.skills.length > 0" class="flex flex-wrap gap-1.5">
                  <span
                    v-for="skill in worker.skills.slice(0, 3)"
                    :key="skill.id"
                    class="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium"
                  >
                    {{ skill.skill_name }}
                  </span>
                  <span
                    v-if="worker.skills.length > 3"
                    class="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                  >
                    +{{ worker.skills.length - 3 }} more
                  </span>
                </div>

                <!-- Action Button -->
                <div class="mt-auto pt-3">
                  <button
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {{ $t('searchWorkers.viewFullProfile') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="bg-white rounded-lg shadow-md p-12 text-center">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 9H3v10a6 6 0 0010.016 5.235M15 13h6v10a6 6 0 01-10.016 5.235" />
            </svg>
            <p class="text-gray-500 text-lg font-medium">{{ $t('searchWorkers.noWorkersFound') }}</p>
            <p class="text-gray-400 mt-2">{{ $t('searchWorkers.tryAdjustingFilters') }}</p>
          </div>

          <!-- Pagination -->
          <div v-if="workers.length > 0 && totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
            <button
              @click="previousPage"
              :disabled="currentPage === 1 || loading"
              class="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="flex items-center gap-1">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-2 rounded-lg transition',
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'border hover:bg-gray-100'
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="nextPage"
              :disabled="currentPage === totalPages || loading"
              class="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchWorkers } from '@/services/workers.api'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

// State
const workers = ref([])
const loading = ref(false)
const totalResults = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)

const skillsInput = ref('')
const selectedSkills = ref([])
const availableSkills = ref([])
const skillSearchQuery = ref('')
const showSkillsDropdown = ref(false)
const skillsLoading = ref(false)

const nationalities = ref([])
const nationalitiesLoading = ref(false)
const nationalitySearchQuery = ref('')
const showNationalityDropdown = ref(false)
let nationalitySearchTimeout = null

const filters = ref({
  search: '',
  skills: '',
  gender: '',
  nationality: '',
  experience_years: null,
  education_level: '',
  min_salary: null,
  max_salary: null,
  sort_by: 'created_at',
  sort_order: 'desc',
  page: 1,
  limit: 12,
})

// Computed
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const filteredNationalities = computed(() => nationalities.value)

// Methods
const fetchSkills = async (search = '') => {
  try {
    skillsLoading.value = true
    const query = search ? `?page=1&limit=50&search=${encodeURIComponent(search)}` : '?page=1&limit=50'
    const res = await api.get(`/skills${query}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    availableSkills.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to fetch skills:', err)
  } finally {
    skillsLoading.value = false
  }
}

const fetchNationalities = async (search = '') => {
  try {
    nationalitiesLoading.value = true
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await api.get(`/nationalities${query}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    nationalities.value = res.data?.data || []
  } catch (err) {
    console.error('Failed to fetch nationalities:', err)
  } finally {
    nationalitiesLoading.value = false
  }
}

const handleSkillSearch = (e) => {
  skillSearchQuery.value = e.target.value
  fetchSkills(e.target.value)
}

const handleNationalitySearch = (e) => {
  nationalitySearchQuery.value = e.target.value
  showNationalityDropdown.value = true
  fetchNationalities(e.target.value)
}

const toggleSkill = (skill) => {
  const index = selectedSkills.value.findIndex(s => s.id === skill.id)
  if (index > -1) {
    selectedSkills.value.splice(index, 1)
  } else {
    selectedSkills.value.push(skill)
  }
  updateSkillsFilter()
}

const removeSkill = (skillId) => {
  selectedSkills.value = selectedSkills.value.filter(s => s.id !== skillId)
  updateSkillsFilter()
}

const updateSkillsFilter = () => {
  filters.value.skills = selectedSkills.value
    .map(s => s.name || s.skill_name)
    .join(',')
}

const isSkillSelected = (skillId) => {
  return selectedSkills.value.some(s => s.id === skillId)
}

const toggleSkillsDropdown = () => {
  showSkillsDropdown.value = !showSkillsDropdown.value
  if (showSkillsDropdown.value && !availableSkills.value.length) {
    fetchSkills(skillSearchQuery.value)
  }
}

const toggleNationalityDropdown = () => {
  showNationalityDropdown.value = !showNationalityDropdown.value
}

const selectNationality = (nationality) => {
  filters.value.nationality = nationality.country_name
  nationalitySearchQuery.value = nationality.country_name
  showNationalityDropdown.value = false
}

const clearNationality = () => {
  filters.value.nationality = ''
  nationalitySearchQuery.value = ''
  showNationalityDropdown.value = false
}

const handleClickOutside = (event) => {
  const skillsDropdown = document.querySelector('.skills-dropdown-container')
  const nationalityDropdown = document.querySelector('.nationality-dropdown-container')
  
  if (skillsDropdown && !skillsDropdown.contains(event.target)) {
    showSkillsDropdown.value = false
  }
  
  if (nationalityDropdown && !nationalityDropdown.contains(event.target)) {
    showNationalityDropdown.value = false
  }
}

const updateSkills = () => {
  filters.value.skills = skillsInput.value
    .split(',')
    .map(s => s.trim())
    .filter(s => s)
    .join(',')
}

const applyFilters = async (resetPage = true) => {
  try {
    loading.value = true
    
    if (resetPage) {
      currentPage.value = 1
      filters.value.page = 1
    }

    const params = {
      ...filters.value,
      page: currentPage.value,
    }

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) {
        delete params[key]
      }
    })

    const response = await searchWorkers(params)

    workers.value = response.data || []
    totalResults.value = response.meta?.total || 0
    totalPages.value = response.meta?.totalPage || 1
    currentPage.value = response.meta?.page || 1
  } catch (error) {
    console.error('Error searching workers:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    search: '',
    skills: '',
    gender: '',
    nationality: '',
    experience_years: null,
    education_level: '',
    min_salary: null,
    max_salary: null,
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 12,
  }
  skillsInput.value = ''
  selectedSkills.value = []
  skillSearchQuery.value = ''
  nationalitySearchQuery.value = ''
  currentPage.value = 1
  
  // Reload with fresh filters
  applyFilters()
}

const goToPage = (page) => {
  currentPage.value = page
  filters.value.page = page
  applyFilters(false)
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1)
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

const viewWorkerDetail = (workerId) => {
  router.push(`/workers/${workerId}`)
}

const formatCurrency = (amount, currencyObj) => {
  if (!amount) return `${currencyObj?.symbol || '$'} 0`
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  
  return `${currencyObj?.symbol || '$'} ${formatted}`
}

// Lifecycle
onMounted(() => {
  fetchSkills()
  fetchNationalities()
  
  // Load initial results if there are filters in route query
  if (Object.keys(route.query).length > 0) {
    Object.assign(filters.value, route.query)
  }
  // Always load initial results on component mount
  applyFilters()
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  // Clean up event listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
