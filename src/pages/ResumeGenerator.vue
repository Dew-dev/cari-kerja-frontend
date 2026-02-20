<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <section class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div class="max-w-7xl mx-auto py-12 px-4">
        <h1 class="text-4xl font-bold mb-3">
          {{ $t("resumeGenerator") }}
        </h1>
        <p class="text-white/90 text-lg">
          {{ $t("resumeGeneratorSubtitle") }}
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <router-link to="/" class="hover:text-blue-600">{{
              $t("home.home")
            }}</router-link>
          </li>
          <li>/</li>
          <li class="text-gray-900 font-medium">{{ $t("resumeGenerator") }}</li>
        </ol>
      </nav>

      <div
        v-if="auth.isLoggedIn"
        class="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <p class="text-sm text-blue-800">
          {{
            profileDataLoaded
              ? $t("profileDataLoaded") || "Profile data loaded into resume"
              : $t("profileAutofillHint") || "Use your profile data to auto-fill this resume"
          }}
        </p>
        <button
          @click="loadFromProfile"
          :disabled="loadingProfileData"
          class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{
            loadingProfileData
              ? $t("loadingProfileData") || "Loading..."
              : $t("loadFromProfile") || "Load from Profile"
          }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Form Section -->
        <div class="space-y-6">
          <!-- Personal Information -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ $t("personalInformation") }}
            </h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("fullName") }}</label>
                <input v-model="resume.personalInfo.fullName" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterFullName')" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("contactActions.email") }}</label>
                  <input v-model="resume.personalInfo.email" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterEmail')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("phone") }}</label>
                  <input v-model="resume.personalInfo.phone" type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterPhone')" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("address") }}</label>
                <input v-model="resume.personalInfo.address" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterAddress')" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("professionalSummary") }}</label>
                <textarea v-model="resume.personalInfo.summary" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterSummary')"></textarea>
              </div>
            </div>
          </div>

          <!-- Work Experience -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ $t("workExperience") }}
            </h2>
            <button @click="addExperience" class="w-full py-2 px-4 mb-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ $t("addExperience") }}
            </button>
            <div v-for="(exp, index) in resume.experience" :key="index" class="mb-4 p-4 border border-gray-200 rounded-md">
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("jobTitle") }}</label>
                  <input v-model="exp.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterJobTitle')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("company") }}</label>
                  <input v-model="exp.company" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterCompany')" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("startDate") }}</label>
                    <input v-model="exp.startDate" type="month" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("endDate") }}</label>
                    <input v-model="exp.endDate" type="month" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :disabled="exp.current" />
                    <label class="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <input v-model="exp.current" type="checkbox" class="rounded" />
                      {{ $t("currentlyWorking") }}
                    </label>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("description") }}</label>
                  <textarea v-model="exp.description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterDescription')"></textarea>
                </div>
                <button v-if="resume.experience.length > 1" @click="removeExperience(index)" class="text-red-600 text-sm hover:text-red-700 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {{ $t("remove") }}
                </button>
              </div>
            </div>
          </div>

          <!-- Education -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              {{ $t("education") }}
            </h2>
            <button @click="addEducation" class="w-full py-2 px-4 mb-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ $t("addEducation") }}
            </button>
            <div v-for="(edu, index) in resume.education" :key="index" class="mb-4 p-4 border border-gray-200 rounded-md">
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("degree") }}</label>
                  <input v-model="edu.degree" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterDegree')" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("institution") }}</label>
                  <input v-model="edu.institution" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterInstitution')" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("startDate") }}</label>
                    <input v-model="edu.startDate" type="month" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t("endDate") }}</label>
                    <input v-model="edu.endDate" type="month" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <button v-if="resume.education.length > 1" @click="removeEducation(index)" class="text-red-600 text-sm hover:text-red-700 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {{ $t("remove") }}
                </button>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              {{ $t("skills") }}
            </h2>
            <div class="space-y-3">
              <div class="flex flex-wrap gap-2">
                <span v-for="(skill, index) in resume.skills" :key="index" class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {{ skill }}
                  <button @click="removeSkill(index)" class="hover:text-blue-900">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
              <div class="flex gap-2">
                <input v-model="newSkill" @keydown.enter="addSkill" type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" :placeholder="$t('enterSkill')" />
                <button @click="addSkill" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                  {{ $t("add") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="lg:sticky lg:top-6 h-fit">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900">{{ $t("preview") }}</h2>
              <button @click="downloadPDF" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {{ $t("downloadPDF") }}
              </button>
            </div>
            
            <!-- Resume Preview -->
            <div id="resume-preview" style="min-height: 800px; color: #000; font-family: Arial, sans-serif; background: white; padding: 20px;">
             
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                <h1 style="font-size: 28px; font-weight: bold; color: #000; margin-bottom: 10px;">{{ resume.personalInfo.fullName || 'Your Name' }}</h1>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; color: #666; font-size: 13px;">
                  <span v-if="resume.personalInfo.email">{{ resume.personalInfo.email }}</span>
                  <span v-if="resume.personalInfo.phone">{{ resume.personalInfo.phone }}</span>
                  <span v-if="resume.personalInfo.address">{{ resume.personalInfo.address }}</span>
                </div>
              </div>

              <!-- Summary -->
              <div v-if="resume.personalInfo.summary" style="margin-bottom: 20px;">
                <h2 style="font-size: 15px; font-weight: bold; color: #000; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Professional Summary</h2>
                <p style="color: #333; line-height: 1.6;">{{ resume.personalInfo.summary }}</p>
              </div>

              <!-- Experience -->
              <div v-if="resume.experience.some(e => e.title)" style="margin-bottom: 20px;">
                <h2 style="font-size: 15px; font-weight: bold; color: #000; margin-bottom: 15px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Work Experience</h2>
                <div v-for="(exp, index) in resume.experience.filter(e => e.title)" :key="index" style="margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                    <h3 style="font-weight: bold; color: #000;">{{ exp.title }}</h3>
                    <span style="color: #666; font-size: 11px;">{{ formatDate(exp.startDate) }} - {{ exp.current ? 'Present' : formatDate(exp.endDate) }}</span>
                  </div>
                  <p style="color: #333; font-style: italic; margin-bottom: 5px;">{{ exp.company }}</p>
                  <p style="color: #555; font-size: 13px;">{{ exp.description }}</p>
                </div>
              </div>

              <!-- Education -->
              <div v-if="resume.education.some(e => e.degree)" style="margin-bottom: 20px;">
                <h2 style="font-size: 15px; font-weight: bold; color: #000; margin-bottom: 15px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Education</h2>
                <div v-for="(edu, index) in resume.education.filter(e => e.degree)" :key="index" style="margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                    <h3 style="font-weight: bold; color: #000;">{{ edu.degree }}</h3>
                    <span style="color: #666; font-size: 11px;">{{ formatDate(edu.startDate) }} - {{ formatDate(edu.endDate) }}</span>
                  </div>
                  <p style="color: #333; font-style: italic;">{{ edu.institution }}</p>
                </div>
              </div>

              <!-- Skills -->
              <div v-if="resume.skills.length > 0" style="margin-bottom: 20px;">
                <h2 style="font-size: 15px; font-weight: bold; color: #000; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Skills</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <span v-for="(skill, index) in resume.skills" :key="index" style="display: inline-block; padding: 5px 10px; background-color: #ddd; color: #333; border-radius: 3px; font-size: 12px;">
                    {{ skill }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import html2pdf from "html2pdf.js";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";

const auth = useAuthStore();
const loadingProfileData = ref(false);
const profileDataLoaded = ref(false);

const resume = ref({
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
  },
  experience: [
    {
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    },
  ],
  education: [
    {
      degree: "",
      institution: "",
      startDate: "",
      endDate: "",
    },
  ],
  skills: [],
});

const newSkill = ref("");

function toMonthValue(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getSkillName(skillItem) {
  if (!skillItem) return "";
  if (typeof skillItem === "string") return skillItem;
  return skillItem.name || skillItem.skill_name || skillItem.skill?.name || "";
}

async function loadFromProfile() {
  if (!auth.isLoggedIn) return;

  try {
    loadingProfileData.value = true;
    const res = await api.get("/users/workers/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = res.data?.data || res.data || {};

    resume.value.personalInfo = {
      fullName: data.name || auth.user?.name || "",
      email: data.email || auth.user?.email || "",
      phone: data.telephone || "",
      address: data.address || "",
      summary: data.profile_summary || data.bio || data.headline || "",
    };

    const mappedExperiences = (data.work_experiences || []).map((item) => ({
      title: item.job_title || "",
      company: item.company_name || "",
      startDate: toMonthValue(item.start_date),
      endDate: toMonthValue(item.end_date),
      current: Boolean(item.is_current),
      description: item.description || "",
    }));

    const mappedEducations = (data.educations || []).map((item) => ({
      degree: [item.degree, item.major].filter(Boolean).join(" - "),
      institution: item.institution_name || "",
      startDate: toMonthValue(item.start_date),
      endDate: toMonthValue(item.end_date),
    }));

    const mappedSkills = (data.worker_skills || [])
      .map((item) => getSkillName(item))
      .filter(Boolean);

    resume.value.experience = mappedExperiences.length
      ? mappedExperiences
      : [
          {
            title: "",
            company: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
          },
        ];

    resume.value.education = mappedEducations.length
      ? mappedEducations
      : [
          {
            degree: "",
            institution: "",
            startDate: "",
            endDate: "",
          },
        ];

    resume.value.skills = [...new Set(mappedSkills)];
    profileDataLoaded.value = true;
  } catch (error) {
    console.error("Failed to load profile data for resume generator:", error);
  } finally {
    loadingProfileData.value = false;
  }
}

function addExperience() {
  resume.value.experience.unshift({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });
}

function removeExperience(index) {
  resume.value.experience.splice(index, 1);
}

function addEducation() {
  resume.value.education.unshift({
    degree: "",
    institution: "",
    startDate: "",
    endDate: "",
  });
}

function removeEducation(index) {
  resume.value.education.splice(index, 1);
}

function addSkill() {
  if (newSkill.value.trim()) {
    resume.value.skills.push(newSkill.value.trim());
    newSkill.value = "";
  }
}

function removeSkill(index) {
  resume.value.skills.splice(index, 1);
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month] = dateString.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function downloadPDF() {
  try {
    const element = document.getElementById("resume-preview");
    if (!element) {
      console.error("Resume preview element not found");
      return;
    }

    const opt = {
      margin: 10,
      filename: `${resume.value.personalInfo.fullName || "resume"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error("PDF download error:", error);
    alert("Failed to download PDF. Please try again.");
  }
}

onMounted(() => {
  if (auth.isLoggedIn) {
    loadFromProfile();
  } else if (auth.user) {
    resume.value.personalInfo.fullName = auth.user.name || "";
    resume.value.personalInfo.email = auth.user.email || "";
  }
});
</script>