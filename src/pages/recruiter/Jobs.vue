<template>
  <div class="bg-gray-50 min-h-full py-10" @click="closeMenu">
    <div class="max-w-6xl mx-auto px-4">
      <!-- HEADER -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ t("jobs") }}
          </h1>
          <p class="text-sm text-gray-600 mt-2">{{ t("managejobs") }}</p>
        </div>

        <router-link
          to="/recruiter/jobs/create"
          class="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <i class="pi pi-plus"></i>
          <span>{{ t("createjob") }}</span>
        </router-link>
      </div>
      <!-- ACTIVE PLAN BANNER -->
      <ActivePlanBanner />

      <!-- UNVERIFIED COMPANY BANNER -->
      <div
        v-if="isUnverified"
        class="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
      >
        <i class="pi pi-shield text-amber-600"></i>
        <p class="text-sm text-amber-800 flex-1">
          {{ t("verification.banner") }}
        </p>
        <RouterLink
          to="/contact"
          class="text-sm font-semibold text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
        >
          {{ t("verification.cta") }}
        </RouterLink>
      </div>

      <!-- TABS -->
      <div class="mb-6 border-b border-gray-200">
        <div class="flex flex-wrap gap-4 text-sm font-semibold">
          <button
            @click="setActiveTab('active')"
            :class="
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 pb-3 text-blue-600 -mb-px'
                : 'pb-3 text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 -mb-px transition-colors'
            "
          >
            {{ t("activeJobs") }}
            <span class="ml-2 px-2 py-0.5 rounded-full text-xs" :class="activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">
              {{ jobCounter }}
            </span>
          </button>

          <button
            @click="setActiveTab('archived')"
            :class="
              activeTab === 'archived'
                ? 'border-b-2 border-blue-600 pb-3 text-blue-600 -mb-px'
                : 'pb-3 text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 -mb-px transition-colors'
            "
          >
            {{ t("archivedJobs") }}
            <span class="ml-2 px-2 py-0.5 rounded-full text-xs" :class="activeTab === 'archived' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">
              {{ archivedJobCounter }}
            </span>
          </button>
        </div>
      </div>
      <!-- MOBILE LIST -->
      <div class="lg:hidden space-y-4">
        <div v-if="jobs.length > 0 && !loading" class="space-y-4">
          <div
            v-for="(job, index) in jobs"
            :key="job.id"
            :class="[
              'rounded-xl border shadow-sm p-4 transition-all duration-150',
              job.boost_type === 'hot'
                ? 'bg-gradient-to-br from-amber-50/70 to-orange-50/45 border-orange-200 ring-1 ring-orange-100/50'
                : job.boost_type === 'top10'
                ? 'bg-gradient-to-br from-blue-50/70 to-indigo-50/45 border-blue-200 ring-1 ring-blue-100/50'
                : 'bg-white border-gray-100'
            ]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                  <span>{{ job.title }}</span>
                  <span v-if="job.boost_type === 'hot'" class="px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5 whitespace-nowrap">
                    <i class="pi pi-star-fill text-[8px]"></i> HOT
                  </span>
                  <span v-else-if="job.boost_type === 'top10'" class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full flex items-center gap-0.5 whitespace-nowrap">
                    <i class="pi pi-chart-line text-[8px]"></i> Top-10
                  </span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Created {{ formatDate(job.created_at) }}
                </div>
              </div>
              <span
                class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
                :class="statusClass(job.status)"
              >
                {{ job.status }}
              </span>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div class="flex items-center gap-2 text-gray-700">
                <i class="pi pi-map-marker text-gray-400 text-sm"></i>
                <span class="truncate">{{ job.location }}</span>
              </div>
              <div class="text-gray-900 font-medium">
                {{ formatSalary(job) }}
              </div>
              <div class="text-gray-600 text-xs">
                {{ job.employment_type }} · {{ job.experience_level }}
              </div>
              <div class="text-gray-600 text-xs">
                <i class="pi pi-users text-gray-400"></i>
                {{ job.applications }}
              </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <button
                title="View job"
                @click="$router.push(`/jobposts/${job.id}`)"
                class="px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-150"
              >
                <i class="pi pi-eye text-base"></i>
              </button>

              <router-link
                v-if="activeTab === 'active'"
                :to="`/recruiter/jobs/${job.id}/edit`"
                title="Edit job"
                class="px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-150"
              >
                <i class="pi pi-pencil text-base"></i>
              </router-link>

              <button
                v-if="activeTab === 'active'"
                :title="t('pipeline.navLabel')"
                @click="$router.push(`/recruiter/jobs/${job.id}/pipeline`)"
                class="px-3 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-150"
              >
                <i class="pi pi-users text-base"></i>
              </button>

              <!-- BOOST BUTTON (mobile) -->
              <button
                v-if="activeTab === 'active'"
                title="Boost iklan"
                @click="openBoostModal(job)"
                class="px-3 py-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-150"
              >
                <i class="pi pi-chart-line text-base"></i>
              </button>

              <button
                v-if="activeTab === 'archived'"
                title="Restore job"
                @click="openActionModal(job, 'restore')"
                class="px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-150"
              >
                <i class="pi pi-undo text-base"></i>
              </button>

              <button
                v-if="activeTab === 'archived'"
                title="Duplicate job"
                @click="openActionModal(job, 'duplicate')"
                class="px-3 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-150"
              >
                <i class="pi pi-copy text-base"></i>
              </button>

              <button
                v-if="activeTab === 'archived'"
                title="Delete job"
                @click="openActionModal(job, 'delete')"
                class="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-150"
              >
                <i class="pi pi-trash text-base"></i>
              </button>

              <div class="relative">
                <button
                  class="px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-150"
                  title="More actions"
                  @click.stop="toggleMenu(job.id)"
                >
                  <i class="pi pi-ellipsis-v text-base"></i>
                </button>

                <div
                  v-if="openMenuId === job.id"
                  :class="[
                    'absolute right-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50',
                    index === jobs.length - 1 ? 'bottom-full mb-1' : 'mt-1'
                  ]"
                  @click.stop
                >
                  <button
                    v-if="activeTab === 'active'"
                    @click="openActionModal(job, 'duplicate'); closeMenu()"
                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                  >
                    <i class="pi pi-copy"></i>
                    <span>Duplicate job</span>
                  </button>

                  <button
                    v-if="activeTab === 'active'"
                    @click="openActionModal(job, 'archive'); closeMenu()"
                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors"
                  >
                    <i class="pi pi-folder"></i>
                    <span>Archive job</span>
                  </button>

                  <button
                    v-if="activeTab === 'active' && job.status_id === 3"
                    @click="openConfirmModal(job, 1); closeMenu()"
                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors"
                  >
                    <i class="pi pi-upload"></i>
                    <span>Publish job</span>
                  </button>

                  <button
                    v-if="activeTab === 'active' && job.status_id === 1"
                    @click="openConfirmModal(job, 2); closeMenu()"
                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors border-t border-gray-100"
                  >
                    <i class="pi pi-times-circle"></i>
                    <span>Close job</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="loading" class="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <i class="pi pi-spinner pi-spin text-3xl text-blue-500 mb-3"></i>
          <p class="text-gray-600 font-medium">{{ t("loadingJobs") }}</p>
        </div>

        <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-inbox text-3xl text-gray-400"></i>
          </div>
          <p class="text-gray-600 font-medium mb-2">
            {{ activeTab == 'archived' ? $t('noArchivedJobs') : $t('noActiveJobs') }}
          </p>
          <p v-if="activeTab !== 'archived'" class="text-sm text-gray-500">
            Create your first job posting to get started
          </p>
        </div>
      </div>

      <!-- TABLE CARD -->
      <div class="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 hidden lg:block">
        <!-- TABLE -->
        <table class="w-full text-sm">
          <thead class="bg-linear-to-r from-gray-50 to-gray-100 text-gray-700 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left font-semibold uppercase text-xs tracking-wider">{{ t("job_title") }}</th>
              <th class="px-6 py-4 text-left font-semibold uppercase text-xs tracking-wider">{{ t("location") }}</th>
              <th class="px-6 py-4 text-left font-semibold uppercase text-xs tracking-wider">{{ t("salary") }}</th>
              <th class="px-6 py-4 text-left font-semibold uppercase text-xs tracking-wider">{{ t("status") }}</th>
              <th class="px-6 py-4 text-left font-semibold uppercase text-xs tracking-wider">{{ t("applicants") }}</th>
              <th class="px-6 py-4 text-right font-semibold uppercase text-xs tracking-wider">{{ t("actions") }}</th>
            </tr>
          </thead>
          <tbody v-if="jobs.length > 0 && !loading">
            <tr
              v-for="(job, index) in jobs"
              :key="job.id"
              :class="[
                'border-b border-gray-100 transition-all duration-150',
                job.boost_type === 'hot'
                  ? 'bg-amber-50/40 hover:bg-amber-100/40'
                  : job.boost_type === 'top10'
                  ? 'bg-blue-50/20 hover:bg-blue-100/30'
                  : 'hover:bg-blue-50/50'
              ]"
            >
              <!-- JOB -->
              <td class="px-6 py-5">
                <div class="font-semibold text-gray-900 text-base flex items-center gap-2 flex-wrap">
                  {{ job.title }}
                  <span v-if="job.boost_type === 'hot'" class="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <i class="pi pi-star-fill text-[10px]"></i> HOT
                  </span>
                  <span v-else-if="job.boost_type === 'top10'" class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <i class="pi pi-chart-line text-[10px]"></i> Top-10
                  </span>
                </div>
                <div class="text-xs text-gray-600 mt-1 flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-gray-100 rounded">{{ job.employment_type }}</span>
                  <span>·</span>
                  <span>{{ job.experience_level }}</span>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  <i class="pi pi-calendar text-[10px] mr-1"></i>
                  Created {{ formatDate(job.created_at) }}
                </div>
              </td>

              <!-- LOCATION -->
              <td class="px-6 py-5 text-gray-700">
                <div class="flex items-center gap-1">
                  <i class="pi pi-map-marker text-gray-400 text-sm"></i>
                  <span>{{ job.location }}</span>
                </div>
              </td>

              <!-- SALARY -->
              <td class="px-6 py-5 text-gray-900 font-medium">
                {{ formatSalary(job) }}
              </td>

              <!-- STATUS -->
              <td class="px-6 py-5">
                <span
                  class="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
                  :class="statusClass(job.status)"
                >
                  {{ job.status }}
                </span>
              </td>

              <!-- APPLICANTS -->
              <td class="px-6 py-5">
                <span class="inline-flex items-center gap-1 text-gray-900 font-medium">
                  <i class="pi pi-users text-gray-400"></i>
                  {{ job.applications }}
                </span>
              </td>

              <!-- ACTIONS -->
              <td class="px-6 py-5">
                <div class="flex items-center justify-end gap-2">
                  <!-- ACTIVE TAB -->
                  <template v-if="activeTab === 'active'">
                    <!-- VIEW -->
                    <button
                      title="View job"
                      @click="$router.push(`/jobposts/${job.id}`)"
                      class="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-150 transform hover:scale-110"
                    >
                      <i class="pi pi-eye text-base"></i>
                    </button>

                    <!-- EDIT -->
                    <router-link
                      :to="`/recruiter/jobs/${job.id}/edit`"
                      title="Edit job"
                      class="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-all duration-150 transform hover:scale-110"
                    >
                      <i class="pi pi-pencil text-base"></i>
                    </router-link>

                    <!-- CANDIDATE PIPELINE -->
                    <button
                      :title="t('pipeline.navLabel')"
                      @click="$router.push(`/recruiter/jobs/${job.id}/pipeline`)"
                      class="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all duration-150 transform hover:scale-110"
                    >
                      <i class="pi pi-users text-base"></i>
                    </button>

                    <!-- BOOST BUTTON (desktop) -->
                    <button
                      title="Boost iklan"
                      @click="openBoostModal(job)"
                      class="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-all duration-150 transform hover:scale-110"
                    >
                      <i class="pi pi-chart-line text-base"></i>
                    </button>

                    <!-- MORE ACTIONS DROPDOWN BUTTON -->
                    <div class="relative">
                      <button
                        class="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-150"
                        title="More actions"
                        @click.stop="toggleMenu(job.id)"
                      >
                        <i class="pi pi-ellipsis-v text-base"></i>
                      </button>
                      
                      <!-- DROPDOWN MENU -->
                      <div
                        v-if="openMenuId === job.id"
                        :class="[
                          'absolute right-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50',
                          index === jobs.length - 1 ? 'bottom-full mb-1' : 'mt-1'
                        ]"
                        @click.stop
                      >
                        <!-- DUPLICATE -->
                        <button
                          @click="openActionModal(job, 'duplicate'); closeMenu()"
                          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                        >
                          <i class="pi pi-copy"></i>
                          <span>Duplicate job</span>
                        </button>

                        <!-- ARCHIVE -->
                        <button
                          @click="openActionModal(job, 'archive'); closeMenu()"
                          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors"
                        >
                          <i class="pi pi-folder"></i>
                          <span>Archive job</span>
                        </button>

                        <!-- PUBLISH -->
                        <button
                          v-if="job.status_id === 3"
                          @click="openConfirmModal(job, 1); closeMenu()"
                          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors"
                        >
                          <i class="pi pi-upload"></i>
                          <span>Publish job</span>
                        </button>

                        <!-- CLOSE -->
                        <button
                          v-if="job.status_id === 1"
                          @click="openConfirmModal(job, 2); closeMenu()"
                          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors border-t border-gray-100"
                        >
                          <i class="pi pi-times-circle"></i>
                          <span>Close job</span>
                        </button>
                      </div>
                    </div>
                  </template>

                  <!-- ARCHIVED TAB -->
                  <template v-else>
                    <!-- RESTORE -->
                    <button
                      title="Restore job"
                      @click="openActionModal(job, 'restore')"
                      class="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-all duration-150 transform hover:scale-110"
                    >
                      <i class="pi pi-undo text-base"></i>
                    </button>

                    <!-- DUPLICATE -->
                    <button
                      title="Duplicate job"
                      @click="openActionModal(job, 'duplicate')"
                      class="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-all duration-150 transform hover:scale-110"
                    >
                      <i class="pi pi-copy text-base"></i>
                    </button>

                    <!-- DELETE -->
                    <button
                      title="Delete job"
                      @click="openActionModal(job, 'delete')"
                      class="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-150 transform hover:scale-110"
                    >
                      <i class="pi pi-trash text-base"></i>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="loading">
            <tr>
              <td colspan="6" class="px-6 py-16 text-center">
                <div class="flex flex-col items-center justify-center">
                  <i class="pi pi-spinner pi-spin text-4xl text-blue-500 mb-3"></i>
                  <p class="text-gray-600 font-medium">{{ t("loadingJobs") }}</p>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="6" class="px-6 py-16 text-center">
                <div class="flex flex-col items-center justify-center">
                  <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i class="pi pi-inbox text-3xl text-gray-400"></i>
                  </div>
                  <p class="text-gray-600 font-medium mb-2">
                    {{ activeTab == 'archived' ? $t('noArchivedJobs') : $t('noActiveJobs') }}
                  </p>
                  <p v-if="activeTab !== 'archived'" class="text-sm text-gray-500">
                    Create your first job posting to get started
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- PAGINATION -->
      <div
        v-if="totalPages"
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-8"
      >
        <p class="text-sm text-gray-600 font-medium">Page {{ page }} of {{ totalPages }}</p>

        <div class="flex flex-wrap justify-center sm:justify-end gap-2">
          <!-- PREV -->
          <button
            @click="changePage(page - 1)"
            :disabled="page === 1"
            class="px-4 py-2 border border-gray-300 rounded-lg font-medium text-sm transition-all duration-150"
            :class="[
              page === 1
                ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                : 'hover:bg-gray-50 hover:border-gray-400 text-gray-700',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
          >
            <i class="pi pi-chevron-left text-xs mr-1"></i>
            Prev
          </button>

          <!-- NUMBERS -->
          <button
            v-for="p in totalPages"
            :key="p"
            @click="changePage(p)"
            class="min-w-10 px-4 py-2 border rounded-lg font-medium text-sm transition-all duration-150"
            :class="[
              p === page
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'hover:bg-gray-50 hover:border-gray-400 text-gray-700 border-gray-300',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
          >
            {{ p }}
          </button>

          <!-- NEXT -->
          <button
            @click="changePage(page + 1)"
            :disabled="page === totalPages"
            class="px-4 py-2 border border-gray-300 rounded-lg font-medium text-sm transition-all duration-150"
            :class="[
              page === totalPages
                ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                : 'hover:bg-gray-50 hover:border-gray-400 text-gray-700',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
          >
            Next
            <i class="pi pi-chevron-right text-xs ml-1"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- CONFIRM MODAL -->
  <div
    v-if="showConfirmModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="showConfirmModal = false"
  >
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
      <!-- ICON -->
      <div class="flex items-center justify-center w-12 h-12 rounded-full mb-4" :class="nextStatus === 1 ? 'bg-green-100' : 'bg-red-100'">
        <i class="pi text-xl" :class="nextStatus === 1 ? 'pi-upload text-green-600' : 'pi-times-circle text-red-600'"></i>
      </div>
      
      <!-- TITLE -->
      <h3 class="text-xl font-bold text-gray-900 mb-2">
        {{ nextStatus === 1 ? $t('publishJob') : $t('closeJob') }}
      </h3>

      <!-- MESSAGE -->
      <p class="text-sm text-gray-600 mb-6">
        {{
          nextStatus === 1
            ? "Are you sure you want to publish this job?"
            : "Are you sure you want to close this job?"
        }}
      </p>

      <!-- ACTIONS -->
      <div class="flex justify-end gap-3">
        <button
          @click="showConfirmModal = false"
          class="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <button
          @click="confirmUpdateStatus"
          :class="
            nextStatus === 1
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          "
          class="px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          {{ nextStatus === 1 ? $t('publish') : $t('close') }}
        </button>
      </div>
    </div>
  </div>

  <!-- ARCHIVE / RESTORE / DUPLICATE MODAL -->
  <div
    v-if="showActionModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="closeActionModal"
  >
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transform transition-all">
      <!-- ICON -->
      <div class="flex items-center justify-center w-12 h-12 rounded-full mb-4"
        :class="{
          'bg-gray-100': actionType === 'archive',
          'bg-green-100': actionType === 'restore',
          'bg-purple-100': actionType === 'duplicate',
          'bg-red-100': actionType === 'delete'
        }"
      >
        <i class="pi text-xl"
          :class="{
            'pi-folder text-gray-600': actionType === 'archive',
            'pi-undo text-green-600': actionType === 'restore',
            'pi-copy text-purple-600': actionType === 'duplicate',
            'pi-trash text-red-600': actionType === 'delete'
          }"
        ></i>
      </div>
      
      <h3 class="text-xl font-bold text-gray-900 mb-2">
        <span v-if="actionType === 'archive'">Archive job?</span>
        <span v-else-if="actionType === 'restore'">Restore job?</span>
        <span v-else-if="actionType === 'duplicate'">Duplicate job?</span>
        <span v-else-if="actionType === 'delete'">Delete job?</span>
      </h3>

      <p class="text-sm text-gray-600 mb-6">
        <span v-if="actionType === 'archive'">
          This job will be moved to archived list and hidden from active jobs.
        </span>
        <span v-else-if="actionType === 'restore'">
          This job will be restored to active jobs.
        </span>
        <span v-else-if="actionType === 'duplicate'">
          A copy of this job will be created as a draft.
        </span>
        <span v-else-if="actionType === 'delete'">
          This job will be permanently deleted. This action cannot be undone.
        </span>
      </p>

      <div class="flex justify-end gap-3">
        <button
          @click="closeActionModal"
          class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          :disabled="actionLoading"
        >
          Cancel
        </button>

        <button
          @click="confirmAction"
          class="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          :class="
            actionType === 'archive'
              ? 'bg-gray-700 hover:bg-gray-800'
              : actionType === 'restore'
              ? 'bg-green-600 hover:bg-green-700'
              : actionType === 'delete'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          "
          :disabled="actionLoading"
        >
          <span v-if="actionLoading" class="flex items-center gap-2">
            <i class="pi pi-spinner pi-spin"></i>
            Processing...
          </span>
          <span v-else>Confirm</span>
        </button>
      </div>
    </div>
  </div>
  <!-- BOOST JOB MODAL -->
  <BoostJobModal
    v-if="boostModalJob"
    :show="showBoostModal"
    :job="boostModalJob"
    @close="showBoostModal = false"
    @success="fetchJobs"
  />

  <!-- SINGLE POST MODAL -->
  <SinglePostModal
    v-if="singlePostModalJob"
    :show="showSinglePostModal"
    :job="singlePostModalJob"
    @close="showSinglePostModal = false"
    @success="fetchJobs"
  />

  <!-- VERIFICATION REQUIRED MODAL -->
  <VerificationRequiredModal
    :show="showVerificationModal"
    @close="showVerificationModal = false"
  />

</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { getJobPostsSelf } from "@/services/jobposts.api";
import { useRouter } from "vue-router";
import api from "@/services/api";
import ActivePlanBanner from "@/components/recruiter/ActivePlanBanner.vue";
import BoostJobModal from "@/components/recruiter/BoostJobModal.vue";
import SinglePostModal from "@/components/recruiter/SinglePostModal.vue";
import VerificationRequiredModal from "@/components/recruiter/VerificationRequiredModal.vue";
import { isVerificationRequiredError } from "@/utils/apiErrors";
import { useAuthStore } from "@/stores/authStore";
import { getAllPlans, getPaymentOrders } from "@/services/payments.api.js";

const activeTab = ref("active"); // active | archived

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const jobs = ref([]);
const loading = ref(false);
const showConfirmModal = ref(false);
const selectedJob = ref(null);
const nextStatus = ref(null);
const showVerificationModal = ref(false);
const jobCounter = ref(0);
const archivedJobCounter = ref(0);
const countit = ref(false);
const page = ref(1);
const limit = ref(5);
const totalPages = ref(1);
const openMenuId = ref(null);

const boostPlans = ref([]);
const paidBoostOrders = ref([]);

async function loadBoostMetadata() {
  try {
    const [plansRes, ordersRes] = await Promise.all([
      getAllPlans("boost"),
      getPaymentOrders({ order_type: "boost", status: "paid", limit: 50 })
    ]);
    boostPlans.value = plansRes?.data?.boost || [];
    paidBoostOrders.value = ordersRes?.data || [];
  } catch (err) {
    console.error("Failed to load boost metadata", err);
  }
}

function applyBoostsToJobs() {
  if (!jobs.value || jobs.value.length === 0) return;
  
  jobs.value = jobs.value.map(job => {
    if (job.boost_type) return job;
    
    const activeBoost = paidBoostOrders.value.find(order => {
      if (order.job_post_id !== job.id) return false;
      
      const plan = boostPlans.value.find(p => p.id === order.plan_id);
      if (!plan) return false;
      
      const paidAt = new Date(order.paid_at || order.created_at);
      const expiresAt = new Date(paidAt.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
      return expiresAt > new Date();
    });
    
    if (activeBoost) {
      const plan = boostPlans.value.find(p => p.id === activeBoost.plan_id);
      return {
        ...job,
        boost_type: plan?.boost_priority === 1 ? "hot" : "top10",
      };
    }
    
    return job;
  });
}

function toggleMenu(jobId) {
  openMenuId.value = openMenuId.value === jobId ? null : jobId;
}

function closeMenu() {
  openMenuId.value = null;
}

function statusClass(status) {
  switch (status) {
    case "OPEN":
      return "bg-green-100 text-green-800";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800";
    case "CLOSED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

const showActionModal = ref(false);
const actionType = ref(null); // 'archive' | 'restore'
// const selectedJob = ref(null);
const actionLoading = ref(false);

function openActionModal(job, type) {
  selectedJob.value = job;
  actionType.value = type;
  showActionModal.value = true;
}

function closeActionModal() {
  showActionModal.value = false;
  selectedJob.value = null;
  actionType.value = null;
}

// async function archiveJob(jobId) {
//   if (!confirm("Archive this job?")) return;
//   await api.post(`/job-posts/${jobId}/archive`, {}, {
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//   });
//   fetchJobs();
// }

// async function restoreJob(jobId) {
//   await api.post(`/job-posts/${jobId}/restore`, {}, {
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//   } );
//   fetchJobs();
// }

async function confirmAction() {
  if (!selectedJob.value) return;

  try {
    actionLoading.value = true;

    if (actionType.value === "archive") {
      await api.post(
        `/job-posts/${selectedJob.value.id}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      fetchJobs(); // refresh table
      archivedJobs(); // refresh archived
    }
    
    if (actionType.value === "restore") {
      await api.post(
        `/job-posts/${selectedJob.value.id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      fetchJobs(); // refresh table
      archivedJobs(); // refresh archived
    }

    if (actionType.value === "duplicate") {
      const res = await api.post(`/job-posts/${selectedJob.value.id}/duplicate`);
      const newId = res.data?.data?.id;
      router.push(`/recruiter/jobs/${newId}/edit`);
      closeActionModal();
      fetchJobs(); // refresh table
      archivedJobs(); // refresh archived
      return;
    }

    if (actionType.value === "delete") {
      await api.delete(`/job-posts/${selectedJob.value.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchJobs(); // refresh table
      archivedJobs(); // refresh archived
      push.success(t("notifications.jobDeletedSuccessfully"));
    }

    closeActionModal();
    countit.value = !countit.value;
    fetchJobs(); // refresh table
    archivedJobs(); // refresh archived
    page.value = 1; // reset to first page
  } catch (err) {
    console.error("Action failed", err);
    // 403 saat duplicate = kuota posting penuh; tampilkan pesan backend
    if (err?.response?.status === 403 && err?.response?.data?.message) {
      push.error(err.response.data.message);
    } else {
      push.error(t("notifications.actionFailed"));
    }
  } finally {
    actionLoading.value = false;
  }
}

async function fetchJobs() {
  try {
    loading.value = true;

    const res = await getJobPostsSelf({
      page: page.value,
      limit: limit.value,
    });
    if (!countit.value && activeTab.value === "active") {
      jobs.value = res.data?.data || [];
      applyBoostsToJobs();
      totalPages.value = res.data?.meta?.totalPage || 1;
    }
    jobCounter.value = res.data?.meta?.total || 0;
    countit.value = false;
  } catch (err) {
    console.error("Failed to fetch recruiter jobs", err);
  } finally {
    loading.value = false;
  }
}

async function archivedJobs() {
  try {
    const res = await getJobPostsSelf({
      page: page.value,
      limit: limit.value,
      archive: true,
    });
    if (!countit.value && activeTab.value === "archived") {
      jobs.value = res.data?.data || [];
      applyBoostsToJobs();
      totalPages.value = res.data?.meta?.totalPage || 1;
    }
    archivedJobCounter.value = res.data?.meta?.total || 0;
    countit.value = false;
  } catch (err) {
    console.error("Failed to count archived jobs", err);
  }
}

// Proaktif: tampilkan banner bila backend melaporkan perusahaan belum terverifikasi.
// Banner hanya muncul jika field is_verified tersedia di response (bernilai false).
const isUnverified = ref(false);

async function checkCompanyVerification() {
  try {
    const userId = auth.user?.user_id || auth.user?.id;
    if (!userId) return;
    const res = await api.get(`/users/${userId}/recruiters`);
    const recruiter = res.data?.data;
    if (recruiter && Object.prototype.hasOwnProperty.call(recruiter, "is_verified")) {
      isUnverified.value = recruiter.is_verified === false;
    }
  } catch (err) {
    console.error("Failed to check company verification", err);
  }
}

onMounted(async () => {
  await loadBoostMetadata();
  fetchJobs();
  archivedJobs();
  checkCompanyVerification();
});

function formatSalary(job) {
  if (!job.salary_min || !job.salary_max) return "—";
  return `${job.salary_min} - ${job.salary_max} ${job.currency}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function changePage(p) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
  console.log("toalPages:", totalPages.value);
  console.log("Changing to page:", page.value);
  if (activeTab.value === "archived") {
    archivedJobs();
  } else {
    fetchJobs();
  }
}

function setActiveTab(tab) {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  page.value = 1;
  if (tab === "archived") {
    archivedJobs();
  } else {
    fetchJobs();
  }
}

function openConfirmModal(job, status) {
  selectedJob.value = job;
  nextStatus.value = status;
  console.log(
    "Selected Job:",
    selectedJob.value.id,
    "Next Status:",
    nextStatus.value,
  );
  showConfirmModal.value = true;
}

async function confirmUpdateStatus() {
  try {
    await api.post(`/job-posts/status/${selectedJob.value.id}`, {
      status_id: nextStatus.value,
    });

    // optimistic update
    selectedJob.value.status_id = nextStatus.value;

    const arr = ["OPEN", "CLOSED", "DRAFT", "ARCHIVED"];
    selectedJob.value.status = arr[nextStatus.value - 1];
  } catch (err) {
    console.error("Failed to update job status", err);
    // Recruiter belum diverifikasi → CTA verifikasi, bukan toast generik
    if (isVerificationRequiredError(err)) {
      showVerificationModal.value = true;
    } else {
      push.error(t("notifications.failedToUpdateJobStatus"));
    }
  } finally {
    showConfirmModal.value = false;
    selectedJob.value = null;
    nextStatus.value = null;
  }
}

async function duplicateJob(jobId) {
  try {
    const res = await api.post(`/job-posts/${jobId}/duplicate`);
    console.log("Duplicate job response:", res);
    const newId = res.data?.data?.id;

    // langsung ke edit
    router.push(`/recruiter/jobs/${newId}/edit`);
  } catch (err) {
    console.error("Duplicate failed", err);
    if (err?.response?.status === 403 && err?.response?.data?.message) {
      push.error(err.response.data.message);
    } else {
      push.error(t("notifications.failedToDuplicateJob"));
    }
  }
}

// ─── Boost Modal ─────────────────────────────────────────────────────────────
const showBoostModal = ref(false);
const boostModalJob = ref(null);

function openBoostModal(job) {
  boostModalJob.value = job;
  showBoostModal.value = true;
  closeMenu();
}

// ─── Single Post Modal ────────────────────────────────────────────────────────
const showSinglePostModal = ref(false);
const singlePostModalJob = ref(null);

function openSinglePostModal(job) {
  singlePostModalJob.value = job;
  showSinglePostModal.value = true;
  closeMenu();
}
</script>
