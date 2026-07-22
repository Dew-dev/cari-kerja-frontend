<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="max-w-5xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-8">
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>

    <!-- Job Detail Content -->
    <div v-else-if="job" class="max-w-5xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <router-link to="/" class="hover:text-blue-600">{{
              $t("home.home")
            }}</router-link>
          </li>
          <li>/</li>
          <li>
            <router-link to="/jobposts" class="hover:text-blue-600">{{
              $t("jobs")
            }}</router-link>
          </li>
          <li>/</li>
          <li class="text-gray-900 font-medium">{{ job.title }}</li>
        </ol>
      </nav>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Job Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Job Header Card -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex gap-4 mb-6">
              <div class="shrink-0">
                <img
                  :src="
                    fileStorageUrl + job.avatar_url ||
                    '/company-default-image.png'
                  "
                  @error="(e) => (e.target.src = '/company-default-image.png')"
                  :alt="job.company_name"
                  class="w-20 h-20 rounded-lg shadow-sm object-contain"
                />
              </div>
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">
                  {{ job.title }}
                </h1>
                <div
                  class="flex flex-wrap items-center gap-4 text-sm text-gray-600"
                >
                  <div class="flex items-center gap-1">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span class="font-medium">{{ job.company_name }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{{ job.location }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{{ timeAgo(job.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Job Key Info -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="bg-linear-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4">
                <div class="text-xs text-gray-600 font-semibold mb-2">{{ $t("salary") }}</div>
                <div class="text-lg font-bold text-green-700">
                  {{ formatNumber(job.salary_min) }} - {{ formatNumber(job.salary_max) }}
                </div>
                <div class="text-xs text-gray-600 mt-1">{{ job.currency_code }}</div>
              </div>
              <div class="bg-linear-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4">
                <div class="text-xs text-gray-600 font-semibold mb-2">
                  {{ $t("employmentType") }}
                </div>
                <div class="text-lg font-bold text-blue-700">
                  {{ job.employment_type }}
                </div>
              </div>
              <div class="bg-linear-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-4">
                <div class="text-xs text-gray-600 font-semibold mb-2">
                  {{ $t("category") }}
                </div>
                <div class="text-sm font-bold text-purple-700">
                  {{ job.category_name }}
                </div>
              </div>
            </div>

            <!-- Apply Button -->
            <div class="flex gap-3">
              <button
                v-if="!auth.isLoggedIn || auth.role === 'user'"
                @click="handleApply"
                :disabled="isApplying || hasApplied"
                class="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg
                  v-if="hasApplied"
                  class="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span>{{
                  hasApplied
                    ? $t("alreadyApplied")
                    : isApplying
                    ? $t("applying")
                    : $t("applyNow")
                }}</span>
              </button>
              
              <!-- Save Job Button -->
              <button
                v-if="!auth.isLoggedIn || auth.role === 'user'"
                @click="handleSaveJob"
                :disabled="isSavingJob"
                :class="[
                  'px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg',
                  isSaved
                    ? 'bg-linear-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600'
                    : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50',
                  isSavingJob && 'opacity-50 cursor-not-allowed'
                ]"
              >
                <svg
                  class="w-5 h-5"
                  :fill="isSaved ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z"
                  />
                </svg>
                <span>{{ isSaved ? $t("saved") : $t("save") }}</span>
              </button>
            </div>
          </div>

          <!-- Job Description -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ $t("jobDescription") }}
            </h2>
            <RichTextContent
              :html="job.description"
              class="leading-relaxed"
            />
          </div>

          <!-- Requirements -->
          <div
            v-if="job.requirements?.length"
            class="bg-white rounded-lg shadow-md p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Requirements
            </h2>
            <ul
              v-for="requirement in job.requirements"
              class="list-disc list-inside space-y-2 text-gray-700"
            >
              <li class="ml-2">{{ requirement.requirement }}</li>
            </ul>
          </div>

          <!-- Responsibilities -->
          <div
            v-if="job.responsibilities?.length"
            class="bg-white rounded-lg shadow-md p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m2-1l-2-1m2 1v2.5" />
              </svg>
              Responsibilities
            </h2>
            <ul
              v-for="responsibility in job.responsibilities"
              class="list-disc list-inside space-y-2 text-gray-700"
            >
              <li class="ml-2">{{ responsibility.responsibility }}</li>
            </ul>
          </div>

          <!-- Benefits -->
          <div v-if="job.benefits?.length" class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5c.75 0 1.498-.037 2.237-.111a6.009 6.009 0 00-11.066 0c.738.074 1.487.111 2.237.111h6.592z" />
              </svg>
              Benefits
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="benefit in job.benefits"
                :key="benefit.id"
                class="flex gap-3 p-4 rounded-lg bg-green-50 border border-green-200"
              >
                <svg class="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-900 text-sm">{{ benefit.benefit }}</span>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div v-if="skills?.length" class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5h.01" />
              </svg>
              Required Skills
            </h2>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="skill in skills"
                :key="skill.id"
                class="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-700 font-medium text-sm hover:bg-indigo-100 transition cursor-default"
              >
                {{ skill.skill || skill.skill_name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Company Info & Similar Jobs -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Company Info Card -->
          <div class="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">
              {{ $t("aboutCompany") }}
            </h3>
            <div class="flex items-center gap-3 mb-4">
              <img
                :src="
                  fileStorageUrl + job.avatar_url ||
                  '/company-default-image.png'
                "
                @error="(e) => (e.target.src = '/company-default-image.png')"
                :alt="job.company_name"
                class="w-16 h-16 rounded-lg shadow-sm object-contain"
              />
              <div>
                <h4 class="font-semibold text-gray-900">
                  {{ job.company_name }}
                </h4>
                <p class="text-sm text-gray-600">
                  {{ job.industry || "Technology" }}
                </p>
              </div>
            </div>

            <div class="space-y-3 text-sm">
              <div v-if="job.company_website" class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 mt-0.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <a
                  :href="`https://${job.company_website}`"
                  target="_blank"
                  class="text-blue-600 hover:underline break-all"
                >
                  {{ t("visitWebsite") }}
                </a>
              </div>

              <div v-if="job.email" class="flex items-start gap-2">
                <svg
                  class="w-4 h-4 mt-0.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span class="text-gray-600 break-all">{{ job.email }}</span>
              </div>

              <div v-if="job.company_description" class="mt-4 pt-4">
                <RichTextContent
                  :html="job.company_description"
                  class="text-sm"
                />
              </div>
            </div>

            <button
              @click="viewCompanyProfile"
              class="mt-4 w-full shadow-md text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {{ $t("viewCompanyProfile") }}
            </button>
          </div>

          <!-- Similar Jobs -->
          <div
            v-if="similarJobs.length > 0"
            class="bg-white rounded-lg shadow-md p-6"
          >
            <h3 class="text-lg font-bold text-gray-900 mb-4">
              {{ $t("similarJobs") }}
            </h3>
            <div class="space-y-4">
              <div
                v-for="similarJob in similarJobs"
                :key="similarJob.id"
                @click="goToJob(similarJob.id)"
                class="shadow-sm rounded-lg p-4 hover:shadow-md cursor-pointer transition"
              >
                <h4
                  class="font-semibold text-gray-900 mb-1 hover:text-blue-600"
                >
                  {{ similarJob.title }}
                </h4>
                <p class="text-sm text-gray-600 mb-2">
                  {{ similarJob.company_name }}
                </p>
                <div
                  class="flex items-center justify-between text-xs text-gray-500"
                >
                  <span>{{ similarJob.location }}</span>
                  <span class="text-green-600 font-semibold">
                    {{ formatNumber(similarJob.salary_max) }}
                    {{ similarJob.currency }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="max-w-5xl mx-auto px-4 py-16 text-center">
      <div class="bg-white rounded-lg shadow p-8">
        <svg
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">
          {{ $t("jobNotFound") }}
        </h3>
        <p class="text-gray-600 mb-6">
          {{ $t("jobnotfoundSub") }}
        </p>
        <router-link
          to="/jobposts"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
        >
          {{ $t("backToJobListings") }}
        </router-link>
      </div>
    </div>
    <!-- Application Modal -->
    <div
      v-if="showApplicationModal"
      @click.self="closeApplicationModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div
          class="sticky top-0 bg-white shadow-sm px-6 py-4 flex items-center justify-between"
        >
          <h2 class="text-xl font-bold text-gray-900">
            {{ $t("applyForJob") }}
          </h2>
          <button
            @click="closeApplicationModal"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <!-- Job Info -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900">{{ job.title }}</h3>
            <p class="text-sm text-gray-600">{{ job.company_name }}</p>
          </div>

          <!-- Resume Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t("selectResume") }}
              <span class="text-red-500 ml-1">*</span>
            </label>
            <select
              v-model="applicationForm.resume_id"
              class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{{ $t("chooseResume") }}</option>
              <option
                v-for="resume in resumes"
                :key="resume.id"
                :value="resume.id"
              >
                {{ resume.title || resume.name }}
              </option>
            </select>
            <p v-if="resumes.length === 0" class="text-xs text-gray-500 mt-1">
              {{ $t("noResumesAvailable") }}
            </p>
          </div>

          <!-- Cover Letter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t("coverLetter") }}
              <span class="ml-2 text-xs text-gray-400">{{
                $t("optional")
              }}</span>
            </label>
            <textarea
              v-model="applicationForm.cover_letter"
              rows="4"
              maxlength="5000"
              class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="$t('coverLetterPlaceholder')"
            ></textarea>
            <p
              class="mt-1 text-xs text-right"
              :class="(applicationForm.cover_letter || '').length >= 5000 ? 'text-red-500' : 'text-gray-400'"
            >
              {{ (applicationForm.cover_letter || '').length }}/5000
            </p>
          </div>

          <!-- Questions Section -->
          <div v-if="jobQuestions.length > 0" class="space-y-4">
            <h3 class="font-semibold text-gray-900">
              {{ $t("additionalQuestions") }}
            </h3>

            <div
              v-for="(question, index) in jobQuestions"
              :key="question.id"
              class="shadow-sm rounded-lg p-4"
            >
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ index + 1 }}. {{ question.question_text }}
                <span v-if="question.is_required" class="text-red-500 ml-1"
                  >*</span
                >
              </label>

              <!-- TEXT Question Type -->
              <textarea
                v-if="question.question_type_id === 1"
                v-model="applicationForm.answers[index].answer"
                rows="3"
                class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :placeholder="$t('yourAnswer')"
                :required="question.is_required"
              ></textarea>

              <!-- RATING Question Type (1-5 stars) -->
              <div
                v-else-if="question.question_type_id === 2"
                class="flex items-center gap-2"
              >
                <button
                  v-for="rating in 5"
                  :key="rating"
                  type="button"
                  @click="
                    applicationForm.answers[index].answer = rating.toString()
                  "
                  class="text-2xl transition"
                  :class="
                    Number(applicationForm.answers[index].answer) >= rating
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  "
                >
                  ★
                </button>
                <span class="text-sm text-gray-600 ml-2">
                  {{ applicationForm.answers[index].answer || "0" }}/5
                </span>
              </div>

              <!-- MULTIPLE_CHOICE Question Type -->
              <div
                v-else-if="question.question_type_id === 3"
                class="space-y-2"
              >
                <label
                  v-for="(option, optIndex) in question.options?.choices || []"
                  :key="optIndex"
                  class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="radio"
                    :name="`question_${question.id}`"
                    :value="option"
                    v-model="applicationForm.answers[index].answer"
                    :required="question.is_required"
                    class="text-blue-600"
                  />
                  <span class="text-sm text-gray-700">{{ option }}</span>
                </label>
              </div>

              <!-- BOOLEAN Question Type -->
              <div
                v-else-if="question.question_type_id === 4"
                class="flex gap-4"
              >
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    :name="`question_${question.id}`"
                    value="Yes"
                    v-model="applicationForm.answers[index].answer"
                    :required="question.is_required"
                    class="text-blue-600"
                  />
                  <span class="text-sm text-gray-700">{{ $t("yes") }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    :name="`question_${question.id}`"
                    value="No"
                    v-model="applicationForm.answers[index].answer"
                    :required="question.is_required"
                    class="text-blue-600"
                  />
                  <span class="text-sm text-gray-700">{{ $t("no") }}</span>
                </label>
              </div>

              <!-- OPTIONS Question Type (dropdown) -->
              <select
                v-else-if="question.question_type_id === 5"
                v-model="applicationForm.answers[index].answer"
                class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :required="question.is_required"
              >
                <option value="">{{ $t("selectOption") }}</option>
                <option
                  v-for="(option, optIndex) in question.options?.choices || []"
                  :key="optIndex"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="showApplyCaptcha" class="px-6 pb-2">
          <TurnstileWidget
            ref="applyTurnstileRef"
            @verified="onApplyCaptchaVerified"
            @expired="onApplyCaptchaExpired"
          />
        </div>

        <!-- Modal Footer -->
        <div
          class="sticky bottom-0 bg-gray-50 shadow-sm px-6 py-4 flex justify-end gap-3"
        >
          <button
            @click="closeApplicationModal"
            type="button"
            class="px-4 py-2 shadow-sm rounded-md text-gray-700 hover:bg-gray-100 transition"
          >
            {{ $t("cancel") }}
          </button>
          <button
            @click="submitApplication"
            :disabled="isSubmitting || applyCooldown > 0 || !applicationForm.resume_id"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition flex items-center gap-2"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span v-if="applyCooldown > 0">
              {{ $t("auth.resendIn") }} {{ applyCooldown }}s
            </span>
            <span v-else>{{
              isSubmitting ? $t("submitting") : $t("submitApplication")
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getJobPostBenefits,
  getJobPostById,
  getJobPostRequirements,
  getJobPostResponsibilities,
  getJobPosts,
} from "../services/jobposts.api";
// import api from "../services/api";
import {
  saveJob,
  unsaveJob,
  syncSavedState,
} from "../services/saved-jobs.api";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useAuthStore } from "../stores/authStore";
import api from "@/services/api";
import TurnstileWidget from "@/components/common/TurnstileWidget.vue";
import RichTextContent from "@/components/common/RichTextContent.vue";
import {
  isCaptchaError,
  isDuplicateSubmissionError,
  isRateLimitedError,
  getRetryAfterSeconds,
} from "@/utils/apiErrors";

const COVER_LETTER_MAX = 5000;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL;

// State
const props = defineProps(["id"]);
const job = ref(null);
const similarJobs = ref([]);
const loading = ref(true);
const isApplying = ref(false);
const hasApplied = ref(false);
const showApplicationModal = ref(false);
const isSubmitting = ref(false);
const resumes = ref([]);
const jobQuestions = ref([]);
const skills = ref([]);

const showApplyCaptcha = ref(false);
const applyCaptchaToken = ref("");
const applyTurnstileRef = ref(null);
const applyCooldown = ref(0);
let applyCooldownTimer = null;

function onApplyCaptchaVerified(token) {
  applyCaptchaToken.value = token;
}

function onApplyCaptchaExpired() {
  applyCaptchaToken.value = "";
}

function startApplyCooldown(seconds) {
  const sec = Math.max(1, Math.floor(Number(seconds) || 60));
  applyCooldown.value = sec;
  if (applyCooldownTimer) clearInterval(applyCooldownTimer);
  applyCooldownTimer = setInterval(() => {
    applyCooldown.value -= 1;
    if (applyCooldown.value <= 0) {
      clearInterval(applyCooldownTimer);
      applyCooldownTimer = null;
      applyCooldown.value = 0;
    }
  }, 1000);
}

// Application Form
// NOTE: application_status_id is no longer sent — the backend now always
// auto-resolves new applications to the job post's own 'applied' stage.
const applicationForm = ref({
  resume_id: "",
  cover_letter: "",
  answers: [],
});

const isSaved = ref(false);
const savedJobId = ref(null);
const isSavingJob = ref(false);

// Computed
const jobId = computed(() => route.params.id);

// Helper Functions
const formatNumber = (num) => new Intl.NumberFormat("en-US").format(num);

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const units = [
    { name: "year", seconds: 31536000 },
    { name: "month", seconds: 2592000 },
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.seconds);
    if (value >= 1) {
      return `Posted ${new Intl.RelativeTimeFormat("en", {
        numeric: "always",
      }).format(-value, unit.name)}`;
    }
  }

  return "Posted just now";
}

// API Service
const jobDetailService = {
  async fetchJobDetail(id) {
    try {
      // PLACEHOLDER - Ganti dengan endpoint backend Anda
      // const response = await axios.get(`http://your-api.com/api/jobs/${id}`);
      // return response.data;

      const response = await getJobPostById(id);

      return response.data;
      
      // Simulasi data untuk demo
      //       return new Promise((resolve) => {
      //         setTimeout(() => {
      //           resolve({
      //             data: {
      //               id: id,
      //               title: 'Senior Frontend Developer',
      //               company: {
      //                 name: 'Tech Solutions Inc.',
      //                 avatar_url: 'https://via.placeholder.com/80',
      //                 industry: 'Information Technology',
      //                 website: 'https://techsolutions.com',
      //                 email: 'hr@techsolutions.com',
      //                 description: 'Leading technology solutions provider with over 10 years of experience in delivering innovative software products.'
      //               },
      //               location: 'Jakarta, Indonesia',
      //               salary_min: 15000000,
      //               salary_max: 25000000,
      //               currency: 'IDR',
      //               employment_type: 'Full-time',
      //               category: 'IT / Software',
      //               created_at: '2025-01-20T10:00:00Z',
      //               description: `We are looking for an experienced Senior Frontend Developer to join our dynamic team.

      // In this role, you will be responsible for building modern, responsive web applications using Vue.js and other cutting-edge technologies.

      // The ideal candidate should have strong problem-solving skills and a passion for creating exceptional user experiences.`,
      //               requirements: `• 5+ years of experience in frontend development
      // • Expert knowledge of Vue.js, JavaScript/TypeScript
      // • Strong understanding of HTML5, CSS3, and responsive design
      // • Experience with state management (Vuex/Pinia)
      // • Familiarity with RESTful APIs and GraphQL
      // • Experience with version control (Git)
      // • Strong communication skills in English
      // • Bachelor's degree in Computer Science or related field`,
      //               responsibilities: `• Develop and maintain web applications using Vue.js
      // • Collaborate with designers and backend developers
      // • Write clean, maintainable, and testable code
      // • Participate in code reviews and provide constructive feedback
      // • Optimize application performance and ensure cross-browser compatibility
      // • Mentor junior developers and share best practices
      // • Stay up-to-date with latest frontend technologies and trends`,
      //               benefits: `• Competitive salary package
      // • Health insurance coverage
      // • Flexible working hours
      // • Remote work options
      // • Annual performance bonus
      // • Professional development opportunities
      // • Modern office facilities
      // • Team building activities`,
      //               is_applied: false
      //             }
      //           });
      //         }, 800);
      //       });
    } catch (error) {
      console.error("Error fetching job detail:", error);
      throw error;
    }
  },

  async fetchJobPostRequirements(id) {
    try {
      const jobPostRequirements = await getJobPostRequirements(id);
      return jobPostRequirements.data;
    } catch (error) {
      console.error("Error fetching jobPostRequirements:", error);
      throw error;
    }
  },
  async fetchJobPostResponsibilities(id) {
    try {
      const jobPostResponsibilities = await getJobPostResponsibilities(id);
      return jobPostResponsibilities.data;
    } catch (error) {
      console.error("Error fetching jobPostResponsibilities:", error);
      throw error;
    }
  },
  async fetchJobPostBenefits(id) {
    try {
      const jobPostBenefits = await getJobPostBenefits(id);
      return jobPostBenefits.data;
    } catch (error) {
      console.error("Error fetching jobPostBenefits:", error);
      throw error;
    }
  },

  // async fetchJobPostSkills(id) {
  //   try {
  //     const response = await api.get(`/job-posts/${id}/skills`);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error fetching jobPostSkills:", error);
  //     throw error;
  //   }
  // },

  async fetchSimilarJobs(jobId, category) {
    try {
      // PLACEHOLDER - Ganti dengan endpoint backend Anda
      // const response = await axios.get(`http://your-api.com/api/jobs/${jobId}/similar`, {
      //   params: { category }
      // });
      // return response.data;
      const params = {
        category: category,
        exclude_id: jobId,
        limit: 3,
      };
      const response = await getJobPosts(params);
      return response.data;

    } catch (error) {
      console.error("Error fetching similar jobs:", error);
      throw error;
    }
  },

  async applyToJob(jobId) {
    try {
      // PLACEHOLDER - Ganti dengan endpoint backend Anda
      // const response = await axios.post(`http://your-api.com/api/jobs/${jobId}/apply`, {
      //   // Include any application data if needed
      // });
      // return response.data;

      // Simulasi untuk demo
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: "Application submitted successfully",
          });
        }, 1000);
      });
    } catch (error) {
      console.error("Error applying to job:", error);
      throw error;
    }
  },

  async checkApplicationStatus(jobId) {
    try {
      // PLACEHOLDER - Ganti dengan endpoint backend Anda
      // const response = await axios.get(`http://your-api.com/api/jobs/${jobId}/application-status`);
      // return response.data;

      // Simulasi untuk demo
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            has_applied: false,
          });
        }, 500);
      });
    } catch (error) {
      console.error("Error checking application status:", error);
      throw error;
    }
  },
};

// Methods
const loadJobDetail = async () => {
  try {
    loading.value = true;
    const response = await jobDetailService.fetchJobDetail(jobId.value);
    job.value = response.data;

    const savedState = syncSavedState(jobId.value, job.value);
    savedJobId.value = savedState.savedJobId;
    isSaved.value = savedState.isSaved;
    console.log("Job detail loaded:", job.value);
    // Check if user has already applied
    if (auth.isLoggedIn && auth.role === "user") {
      const statusResponse = await jobDetailService.checkApplicationStatus(
        jobId.value,
      );
      hasApplied.value = statusResponse.has_applied || job.value.applied;
    }
    skills.value = job.value.skills || [];
    console.log("Job skills loaded:", skills.value);

    // Load similar jobs
    await loadSimilarJobs();
    await loadJobPostRequirements();
    await loadJobPostResponsibilities();
    await loadJobPostBenefits();
    // await loadJobPostSkills();
    await loadJobQuestions();
  } catch (error) {
    console.error("Error loading job detail:", error);
    job.value = null;
  } finally {
    loading.value = false;
  }
};

const loadJobPostRequirements = async () => {
  try {
    if (!job.value) return;
    const response = await jobDetailService.fetchJobPostRequirements(
      jobId.value,
    );
    job.value = { ...job.value, requirements: response.data };
  } catch (error) {
    console.error("Error loading requirements: ", error);
  }
};
const loadJobPostResponsibilities = async () => {
  try {
    if (!job.value) return;
    const response = await jobDetailService.fetchJobPostResponsibilities(
      jobId.value,
    );
    job.value = { ...job.value, responsibilities: response.data };
  } catch (error) {
    console.error("Error loading responsibilities: ", error);
  }
};
const loadJobPostBenefits = async () => {
  try {
    if (!job.value) return;
    const response = await jobDetailService.fetchJobPostBenefits(jobId.value);
    job.value = { ...job.value, benefits: response.data };
  } catch (error) {
    console.error("Error loading benefits: ", error);
  }
};

// const loadJobPostSkills = async () => {
//   try {
//     if (!job.value) return;
//     const response = await jobDetailService.fetchJobPostSkills(jobId.value);
//     skills.value = response.data || [];
//   } catch (error) {
//     console.error("Error loading skills: ", error);
//     skills.value = [];
//   }
// };

const loadJobQuestions = async () => {
  try {
    // Hanya load questions jika user sudah login dan role adalah user
    if (!auth.isLoggedIn || auth.role !== "user") {
      jobQuestions.value = [];
      return;
    }

    const response = await api.get(`/job-posts/${jobId.value}/questions`);
    jobQuestions.value = response.data?.data || [];

    // Initialize answers array
    applicationForm.value.answers = jobQuestions.value.map((q) => ({
      question_id: q.id,
      answer: "",
    }));
  } catch (error) {
    console.error("Error loading questions:", error);
    jobQuestions.value = [];
  }
};

const loadResumes = async () => {
  try {
    const response = await api.get(`/workers/resumes`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    resumes.value = response.data?.data || [];
  } catch (error) {
    console.error("Error loading resumes:", error);
    resumes.value = [];
  }
};

const closeApplicationModal = () => {
  showApplicationModal.value = false;
  // Reset form
  applicationForm.value = {
    resume_id: "",
    cover_letter: "",
    answers: jobQuestions.value.map((q) => ({
      question_id: q.id,
      answer: "",
    })),
  };
  applyCaptchaToken.value = "";
  applyTurnstileRef.value?.reset();
};

const submitApplication = async () => {
  // Lock: cegah double-submit sebelum response datang
  if (isSubmitting.value || applyCooldown.value > 0) return;

  // Backend menolak cover letter > 5000 karakter — validasi dulu di client
  if ((applicationForm.value.cover_letter || "").length > COVER_LETTER_MAX) {
    push.error(t("coverLetterTooLong", { max: COVER_LETTER_MAX }));
    return;
  }

  // Validate required questions
  for (let i = 0; i < jobQuestions.value.length; i++) {
    const question = jobQuestions.value[i];
    const answer = applicationForm.value.answers[i];

    if (
      question.is_required &&
      (!answer.answer || answer.answer.trim() === "")
    ) {
      push.error(`Please answer question ${i + 1}: ${question.question_text}`);
      return;
    }
  }

  try {
    isSubmitting.value = true;

    const payload = {
      resume_id: applicationForm.value.resume_id,
      cover_letter: applicationForm.value.cover_letter,
      answers: applicationForm.value.answers.filter(
        (a) => a.answer && a.answer.trim() !== "",
      ),
    };
    if (showApplyCaptcha.value && applyCaptchaToken.value) {
      payload.captcha_token = applyCaptchaToken.value;
    }

    await api.post(`/job-posts/${jobId.value}/apply`, payload, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    hasApplied.value = true;
    showApplyCaptcha.value = false;
    closeApplicationModal();
    push.success(t("applicationSubmittedSuccess"));
  } catch (error) {
    console.error("Error submitting application:", error);
    if (isCaptchaError(error)) {
      showApplyCaptcha.value = true;
      applyTurnstileRef.value?.reset();
      push.warning(t("captcha.required"));
      return;
    }
    if (isDuplicateSubmissionError(error)) {
      hasApplied.value = true;
      closeApplicationModal();
      push.info(t("alreadyAppliedMessage"));
      return;
    }
    if (isRateLimitedError(error)) {
      const retryAfter = getRetryAfterSeconds(error) ?? 60;
      startApplyCooldown(retryAfter);
      push.warning(t("captcha.rateLimited"));
      return;
    }
    const errorMsg =
      error.response?.data?.message || t("applicationSubmitFailed");
    push.error(errorMsg);
  } finally {
    isSubmitting.value = false;
  }
};

const loadSimilarJobs = async () => {
  try {
    if (!job.value) return;
    const response = await jobDetailService.fetchSimilarJobs(
      jobId.value,
      job.value.category_name,
    );
    similarJobs.value = response.data;
  } catch (error) {
    console.error("Error loading similar jobs:", error);
  }
};

const handleApply = async () => {
  // Check if user is authenticated
  if (!auth.isLoggedIn) {
    // Redirect to login page with return URL
    router.push({
      path: "/login",
      query: { redirect: route.fullPath },
    });
    return;
  }

  // Check if user is recruiter
  if (auth.role === "recruiter") {
    push.warning(t("recruitersCannotApply"));
    return;
  }

  // Check if already applied
  if (hasApplied.value) {
    return;
  }

  // Load resumes and show modal
  await loadResumes();
  showApplicationModal.value = true;
};

const handleSaveJob = async () => {
  if (!auth.isLoggedIn) {
    router.push({
      path: "/login",
      query: { redirect: route.fullPath },
    });
    return;
  }

  if (auth.role === "recruiter") {
    push.warning(t("recruitersCannotApply"));
    return;
  }

  try {
    isSavingJob.value = true;

    if (isSaved.value) {
      // Selalu DELETE /saved-jobs/:savedJobId — jangan GET self dulu
      await unsaveJob({
        savedJobId: savedJobId.value,
        jobPostId: jobId.value,
      });
      savedJobId.value = null;
      isSaved.value = false;
      push.success(t("jobRemovedFromSaved"));
    } else {
      // POST /saved-jobs/:job_post_id; response.data.id = saved_jobs.id
      const res = await saveJob(jobId.value);
      savedJobId.value = res?.data?.id ?? null;
      isSaved.value = true;
      push.success(t("jobSavedSuccessfully"));
    }
  } catch (error) {
    console.error("Error saving job:", error);
    const errorMsg =
      error?.code === "SAVED_JOB_ID_MISSING"
        ? t("errorSavingJob")
        : error.response?.data?.message || t("errorSavingJob");
    push.error(errorMsg);
  } finally {
    isSavingJob.value = false;
  }
};

const checkIfSaved = async () => {
  if (!auth.isLoggedIn) {
    isSaved.value = false;
    savedJobId.value = null;
  }
};

const viewCompanyProfile = () => {
  // Navigate to company profile page
  router.push(`/recruiters/${job.value.recruiter_id}`);
  // console.log("Navigate to company profile");
};

const goToJob = (id) => {
  router.push({
    name: "JobDetail", // Harus match dengan 'name' di router/index.js
    params: { id: id },
  });
};

// Lifecycle
onMounted(() => {
  loadJobDetail();
});
</script>

<style scoped>
.prose {
  line-height: 1.6;
}

.prose p {
  margin-bottom: 1rem;
}
</style>
