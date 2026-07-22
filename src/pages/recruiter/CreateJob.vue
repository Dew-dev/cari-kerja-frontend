<script setup>
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/authStore.js";

const { t } = useI18n();
const auth = useAuthStore();
import { push } from "notivue";
import api from "@/services/api"; // axios instance
import { useRouter } from "vue-router";
const router = useRouter();
/* ======================
   TAG SEARCH STATE
====================== */
const tagInput = ref("");
const tagSuggestions = ref([]);
const tagLoading = ref(false);
let tagTimeout = null;

watch(tagInput, (val) => {
  if (!val) {
    tagSuggestions.value = [];
    return;
  }

  clearTimeout(tagTimeout);

  tagTimeout = setTimeout(async () => {
    try {
      tagLoading.value = true;
      const res = await api.get(`/tags/all/${val}`);
      // console.log("TAG SEARCH RES:", res.data.data);
      tagSuggestions.value = res.data?.data || [];
      console.log("TAG SUGGESTIONS:", tagSuggestions.value);
      console.log("TAG SUGGESTIONS TYPE:", tagSuggestions.value.length);
    } catch (err) {
      tagSuggestions.value = [];
    } finally {
      tagLoading.value = false;
    }
  }, 300);
});

function selectTag(tag) {
  if (!form.tags.find((t) => t.id === tag.id)) {
    form.tags.push(tag);
  }
  tagInput.value = "";
  tagSuggestions.value = [];
}
function removeTag(tagId) {
  form.tags = form.tags.filter((t) => t.id !== tagId);
}
async function addTag() {
  const name = tagInput.value.trim();
  if (!name) return;

  try {
    tagLoading.value = true;

    const res = await api.post(
      "/tags",
      { name },
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      },
    );

    const newTag = res.data?.data;

    if (newTag && !form.tags.find((t) => t.id === newTag.id)) {
      form.tags.push(newTag);
    }

    tagInput.value = "";
    tagSuggestions.value = [];
  } catch (err) {
    console.error("Failed to add tag", err);
  } finally {
    tagLoading.value = false;
  }
}

/* ======================
   SKILLS STATE
====================== */
const skills = ref([]);
const showSkillModal = ref(false);
const skillSearchQuery = ref("");
const skillSuggestions = ref([]);
const loadingSkills = ref(false);

async function fetchSkills(search = "") {
  if (!search.trim()) {
    skillSuggestions.value = [];
    return [];
  }

  try {
    loadingSkills.value = true;
    const query = `?page=1&limit=10&search=${encodeURIComponent(search)}`;
    const res = await api.get(`/skills${query}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    const data = res.data?.data || [];
    skillSuggestions.value = data.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()),
    );
    return data;
  } catch (err) {
    console.error("Failed to fetch skills:", err);
    return [];
  } finally {
    loadingSkills.value = false;
  }
}

function openSkillModal() {
  showSkillModal.value = true;
  skillSearchQuery.value = "";
  skillSuggestions.value = [];
}

function closeSkillModal() {
  showSkillModal.value = false;
  skillSearchQuery.value = "";
  skillSuggestions.value = [];
}

async function handleSkillSearch(e) {
  skillSearchQuery.value = e.target.value;
  await fetchSkills(e.target.value);
}

async function addSkillFromSuggestion(skill) {
  if (skills.value.some((s) => s.skill_id === skill.id || s.id === skill.id)) {
    return;
  }

  try {
    skills.value.push({
      id: skill.id,
      skill_id: skill.id,
      name: skill.name,
      skill_name: skill.name,
    });
    skillSearchQuery.value = "";
    skillSuggestions.value = [];
  } catch (err) {
    console.error("Failed to add skill", err);
  }
}

async function createAndAddSkill(skillName) {
  if (!skillName.trim()) return;

  try {
    loadingSkills.value = true;

    const createRes = await api.post(
      "/skills",
      { skill_name: skillName.trim() },
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      },
    );

    const newSkill = createRes.data?.data;
    if (!newSkill) throw new Error("Skill creation failed");

    skills.value.push({
      id: newSkill.id,
      skill_id: newSkill.id,
      name: newSkill.skill_name,
      skill_name: newSkill.skill_name,
    });

    skillSearchQuery.value = "";
    skillSuggestions.value = [];
  } catch (err) {
    console.error("Failed to create skill", err);
  } finally {
    loadingSkills.value = false;
  }
}

function handleSkillEnter() {
  if (!skillSearchQuery.value.trim()) return;

  if (skillSuggestions.value.length > 0) {
    addSkillFromSuggestion(skillSuggestions.value[0]);
    return;
  }

  createAndAddSkill(skillSearchQuery.value.trim());
}

function deleteSkill(skillId) {
  skills.value = skills.value.filter((s) => s.id !== skillId);
}

/* ======================
   FORM STATE
====================== */
const form = reactive({
  title: "",
  tags: [],
  salary_min: "",
  salary_max: "",
  currency_id: "",
  employment_type_id: "",
  experience_level_id: "",
  deadline: "",
  category_id: "",
  province: "",
  city: "",
  description: "",
  requirements: [],
  benefits: [],
  responsibilities: [],
  job_post_questions: [],
  is_remote: false,
});

const QUESTION_TYPES = [
  { id: 1, label: "TEXT" },
  { id: 2, label: "RATING" },
  { id: 3, label: "MULTIPLE_CHOICE" },
  { id: 4, label: "BOOLEAN" },
  { id: 5, label: "OPTIONS" },
];

function needsOptions(typeId) {
  return [3, 5].includes(Number(typeId));
}

/* ======================
   DYNAMIC LISTS
====================== */
const newRequirement = ref("");
const newBenefit = ref("");
const newResponsibility = ref("");

function addRequirement() {
  if (!newRequirement.value.trim()) return;
  form.requirements.push({
    requirement: newRequirement.value.trim(),
    order_index: form.requirements.length,
  });
  newRequirement.value = "";
}

function removeRequirement(index) {
  form.requirements.splice(index, 1);
  form.requirements.forEach((item, i) => {
    item.order_index = i;
  });
}

function addBenefit() {
  if (!newBenefit.value.trim()) return;
  form.benefits.push({
    benefit: newBenefit.value.trim(),
    order_index: form.benefits.length,
  });
  newBenefit.value = "";
}

function removeBenefit(index) {
  form.benefits.splice(index, 1);
  form.benefits.forEach((item, i) => {
    item.order_index = i;
  });
}

function addResponsibility() {
  if (!newResponsibility.value.trim()) return;
  form.responsibilities.push({
    responsibility: newResponsibility.value.trim(),
    order_index: form.responsibilities.length,
  });
  newResponsibility.value = "";
}

function removeResponsibility(index) {
  form.responsibilities.splice(index, 1);
  form.responsibilities.forEach((item, i) => {
    item.order_index = i;
  });
}

function addQuestion() {
  form.job_post_questions.push({
    question_text: "",
    question_type_id: 1,
    optionsText: "",
    is_required: true,
    order_index: form.job_post_questions.length,
  });
}

function handleQuestionTypeChange(question) {
  if (!needsOptions(question.question_type_id)) {
    question.optionsText = "";
  }
}

function removeQuestion(index) {
  form.job_post_questions.splice(index, 1);
  form.job_post_questions.forEach((item, i) => {
    item.order_index = i;
  });
}

function buildQuestionsPayload() {
  return form.job_post_questions
    .map((q, index) => {
      const trimmedText = q.question_text?.trim();
      if (!trimmedText) return null;
      const typeId = Number(q.question_type_id) || 1;
      const choices = (q.optionsText || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      return {
        question_text: trimmedText,
        question_type_id: typeId,
        options: needsOptions(typeId) && choices.length ? { choices } : null,
        is_required: !!q.is_required,
        order_index: index,
      };
    })
    .filter(Boolean);
}

/* ======================
   SALARY VALIDATION
====================== */ /* ======================
   CURRENCY SEARCH STATE
====================== */
const currencyInput = ref(null);
const currencyInputRef = ref(null);
const currencyOptions = ref([]);
const currencyLoading = ref(false);
const isSelectingCurrency = ref(false);
let currencyTimeout = null;
const salaryError = ref(null);

async function fetchCurrencies(keyword = "_") {
  try {
    console.log("FETCH CURRENCIES WITH KEYWORD:", keyword);
    currencyLoading.value = true;

    const res = await api.get(`/currencies/${keyword}`);
    const data = res?.data?.data || [];

    currencyOptions.value = data.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
    }));
  } catch (err) {
    console.error("Error loading currencies:", err);
    currencyOptions.value = [];
  } finally {
    currencyLoading.value = false;
  }
}

watch(currencyInput, (val) => {
  if (isSelectingCurrency.value) return;

  if (!val) {
    currencyOptions.value = [];
    return;
  }

  clearTimeout(currencyTimeout);

  currencyTimeout = setTimeout(() => {
    fetchCurrencies(val);
  }, 100);
});

function selectCurrency(currency) {
  isSelectingCurrency.value = true;
  console.log("SELECTED CURRENCY:", currency);
  form.salary_type_id = 3; // assume fixed salary type
  form.currency_id = currency.id;
  currencyInput.value = `${currency.name} (${currency.code})`;
  currencyOptions.value = [];
  // console.log("SELECTED CURRENCY:", currencyInputRef.value);
  setTimeout(() => {
    isSelectingCurrency.value = false;
  }, 0);
}

/* ======================
   CATEGORY SEARCH STATE
====================== */
const categoryInput = ref("");
const categoryOptions = ref([]);
const categoryLoading = ref(false);
const isSelectingCategory = ref(false);
let categoryTimeout = null;

async function fetchCategories(keyword = "") {
  try {
    categoryLoading.value = true;

    const res = await api.get(`/categories/name/${keyword}`);
    const data = res?.data?.data || [];

    categoryOptions.value = data.map((item) => ({
      id: item.id,
      name: item.name,
    }));
  } catch (err) {
    console.error("Error loading categories:", err);
    categoryOptions.value = [];
  } finally {
    categoryLoading.value = false;
  }
}

watch(categoryInput, (val) => {
  if (isSelectingCategory.value) return;

  if (!val) {
    categoryOptions.value = [];
    return;
  }

  clearTimeout(categoryTimeout);

  categoryTimeout = setTimeout(() => {
    fetchCategories(val);
  }, 300);
});

function selectCategory(category) {
  isSelectingCategory.value = true;

  form.category_id = category.id;
  console.log("SELECTED CATEGORY:", category);
  categoryInput.value = category.name;
  categoryOptions.value = [];

  setTimeout(() => {
    isSelectingCategory.value = false;
  }, 0);
}

/* ======================
   LOCATION SEARCH STATE
====================== */
const provinceInput = ref("");
const provinceOptions = ref([]);
const provinceLoading = ref(false);
const isSelectingProvince = ref(false);
const selectedProvinceId = ref(null);
let provinceTimeout = null;

const cityInput = ref("");
const cityOptions = ref([]);
const cityLoading = ref(false);
const isSelectingCity = ref(false);
let cityTimeout = null;

async function fetchProvinces(search = "_") {
  if (!search.trim()) {
    provinceOptions.value = [];
    return;
  }

  try {
    provinceLoading.value = true;
    const res = await api.get("/locations/search", {
      params: {
        search,
        type: "provinces",
      },
    });
    provinceOptions.value = res.data?.data?.provinces || [];
  } catch (err) {
    console.error("Failed to fetch provinces:", err);
    provinceOptions.value = [];
  } finally {
    provinceLoading.value = false;
  }
}

async function fetchCities(search = "_") {
  if (!selectedProvinceId.value || !search.trim()) {
    cityOptions.value = [];
    return;
  }

  try {
    cityLoading.value = true;
    const res = await api.get("/locations/search", {
      params: {
        search,
        type: "cities",
        province_id: selectedProvinceId.value,
      },
    });
    cityOptions.value = res.data?.data?.cities || [];
  } catch (err) {
    console.error("Failed to fetch cities:", err);
    cityOptions.value = [];
  } finally {
    cityLoading.value = false;
  }
}

watch(provinceInput, (val) => {
  if (isSelectingProvince.value) return;
  form.province = val;

  if (!val) {
    provinceOptions.value = [];
    selectedProvinceId.value = null;
    form.city = "";
    cityInput.value = "";
    cityOptions.value = [];
    return;
  }

  clearTimeout(provinceTimeout);
  provinceTimeout = setTimeout(() => {
    fetchProvinces(val);
  }, 300);
});

watch(cityInput, (val) => {
  if (isSelectingCity.value) return;
  form.city = val;

  if (!val) {
    cityOptions.value = [];
    return;
  }

  clearTimeout(cityTimeout);
  cityTimeout = setTimeout(() => {
    fetchCities(val);
  }, 300);
});

function selectProvince(province) {
  isSelectingProvince.value = true;
  selectedProvinceId.value = province.id;
  form.province = province.name;
  provinceInput.value = province.name;
  provinceOptions.value = [];
  form.city = "";
  cityInput.value = "";
  cityOptions.value = [];

  setTimeout(() => {
    isSelectingProvince.value = false;
  }, 0);
}

function selectCity(city) {
  isSelectingCity.value = true;
  form.city = city.name;
  cityInput.value = city.name;
  cityOptions.value = [];

  setTimeout(() => {
    isSelectingCity.value = false;
  }, 0);
}

/* ======================
   SUBMIT
====================== */
async function submit() {
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  };

  const payload = {
    recruiter_id: auth.user?.recruiter_id,
    title: form.title,
    description: form.description,
    employment_type_id: form.employment_type_id,
    experience_level_id: form.experience_level_id,
    salary_type_id: form.salary_type_id || 1,
    job_post_status_id: 1,
    location: form.is_remote ? "Remote" : `${form.city}, ${form.province}`,
    salary_min: form.salary_min,
    salary_max: form.salary_max,
    currency_id: form.currency_id,
    deadline: form.deadline,
    category_id: form.category_id,
    tags: form.tags,
    requirements: form.requirements,
    benefits: form.benefits,
    responsibilities: form.responsibilities,
    job_post_questions: buildQuestionsPayload(),
    skills: skills.value,
    province: form.is_remote ? null : form.province,
    city: form.is_remote ? null : form.city,
    is_remote: form.is_remote,
  };

  try {
    const res = await api.post("/job-posts", payload, authHeaders);
    const { code, message, data } = res?.data || {};
    const jobId = data?.id || data?.data?.id;
    console.log("CREATE JOB POST RES:", res.data.code);
    if (res.data.code !== 201) {
      push.error(err.response?.data?.message || t("notifications.failedToCreateJobPost"));
      return;
    }

    const tags = payload.tags || [];
    if (tags.length) {
      await Promise.all(
        tags.map((tag) =>
          api.post(`/tags/${jobId}`, tag, authHeaders).catch(() => null),
        ),
      );
    }
    console.log("Job post created successfully with ID:", jobId);
    console.log("Redirecting to recruiter jobs page...");
    router.push("/recruiter/jobs");
  } catch (err) {
    push.error(err.response?.data?.message || t("notifications.failedToCreateJobPost"));
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen py-10">
    <div class="max-w-4xl mx-auto px-4">
      <!-- PAGE TITLE -->
      <h1 class="text-xl font-semibold">
        {{ t("createjob") }}
      </h1>
      <p class="text-sm text-gray-500 my-2">
        {{ t("createJobSubtitle") }}
      </p>

      <form @submit.prevent="submit" class="space-y-6">
        <!-- JOB TITLE -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("job_title") }}
            <span class="text-red-500 ml-1">*</span>
            <span class="ml-2 text-xs text-gray-400">{{ t("required") }}</span>
          </label>
          <input
            v-model="form.title"
            class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :placeholder="t('job_title_placeholder')"
          />
        </div>

        <!-- TAGS -->
        <!-- TAGS -->
        <div class="relative">
          <label class="block text-sm font-medium text-gray-700">
            {{ t("tags") }}
            <span class="ml-2 text-xs text-gray-400">{{ t("optional") }}</span>
          </label>

          <!-- SELECTED TAGS -->
          <div class="flex gap-2 flex-wrap mt-2">
            <span
              v-for="tag in form.tags"
              :key="tag.id"
              @click="removeTag(tag.id)"
              class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200"
            >
              {{ tag.name }} ×
            </span>
          </div>

          <!-- INPUT -->
          <input
            v-model="tagInput"
            class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :placeholder="t('add_tag')"
            @keydown.enter.prevent="addTag"
          />

          <!-- DROPDOWN -->
          <div
            v-if="tagInput"
            class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto"
          >
            <!-- HAS SUGGESTIONS -->
            <div
              v-for="tag in tagSuggestions"
              :key="tag.id"
              @click="selectTag(tag)"
              class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
            >
              {{ tag.name }}
            </div>

            <!-- ADD NEW -->
            <div
              v-if="!tagSuggestions.length"
              @click="addTag"
              class="px-3 py-2 text-sm cursor-pointer text-blue-600 hover:bg-blue-50"
            >
              + Add "{{ tagInput }}"
            </div>
          </div>

          <!-- LOADING -->
          <p v-if="tagLoading" class="text-xs text-gray-500 mt-1">
            Searching...
          </p>
        </div>

        <!-- SALARY -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("salary") }}
            <span class="text-red-500 ml-1">*</span>
            <span class="ml-2 text-xs text-gray-400">{{ t("required") }}</span>
          </label>

          <div class="grid md:grid-cols-3 gap-4 mt-1">
            <input
              v-model="form.salary_min"
              type="number"
              class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('min_salary')"
              @input="validateSalary"
            />

            <input
              v-model="form.salary_max"
              type="number"
              class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('max_salary')"
              @input="validateSalary"
            />

            <div class="relative">
              <input
                v-model="currencyInput"
                ref="currencyInputRef"
                class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :placeholder="t('select_currency')"
                @click="fetchCurrencies()"
              />

              <!-- DROPDOWN -->
              <div
                v-if="currencyOptions.length"
                class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto"
              >
                <div
                  v-for="c in currencyOptions"
                  :key="c.id"
                  @click="selectCurrency(c)"
                  class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                >
                  {{ c.name }} ({{ c.code }})
                </div>
              </div>

              <p v-if="currencyLoading" class="text-xs text-gray-500 mt-1">
                Loading currencies…
              </p>
            </div>
          </div>

          <p v-if="salaryError" class="text-red-500 text-sm mt-1">
            {{ salaryError }}
          </p>
        </div>

        <!-- ADVANCED -->
        <div class="grid md:grid-cols-4 gap-4">
          <h3 class="col-span-4 font-semibold">
            {{ t("advanced_info") }}
          </h3>

          <div class="col-span-2">
            <label>
              {{ t("employmentType") }}
              <span class="text-red-500 ml-1">*</span>
              <span class="ml-2 text-xs text-gray-400">{{
                t("required")
              }}</span>
            </label>
            <select
              v-model="form.employment_type_id"
              class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{{ t("select") }}</option>
              <option value="1">Full Time</option>
              <option value="2">Part Time</option>
              <option value="3">Contract</option>
              <option value="4">Internship</option>
              <option value="5">Freelance</option>
            </select>
          </div>

          <div class="col-span-2">
            <label>
              {{ t("job_level") }}
              <span class="text-red-500 ml-1">*</span>
              <span class="ml-2 text-xs text-gray-400">{{
                t("required")
              }}</span>
            </label>
            <select
              v-model="form.experience_level_id"
              class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{{ t("select") }}</option>
              <option value="1">Fresh Graduate</option>
              <option value="2">Junior</option>
              <option value="3">Middle</option>
              <option value="4">Senior</option>
            </select>
          </div>

          <div class="col-span-2">
            <label>
              {{ t("deadline") }}
              <span class="text-red-500 ml-1">*</span>
              <span class="ml-2 text-xs text-gray-400">{{
                t("required")
              }}</span>
            </label>
            <input
              v-model="form.deadline"
              type="date"
              class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <!-- CATEGORY -->
          <div class="col-span-2 relative">
            <label class="block text-sm font-medium text-gray-700">
              {{ t("category") }}
              <span class="text-red-500 ml-1">*</span>
              <span class="ml-2 text-xs text-gray-400">{{
                t("required")
              }}</span>
            </label>

            <input
              v-model="categoryInput"
              class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('select_category')"
            />

            <!-- DROPDOWN -->
            <div
              v-if="categoryOptions.length"
              class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto"
            >
              <div
                v-for="cat in categoryOptions"
                :key="cat.id"
                @mousedown.prevent="selectCategory(cat)"
                class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
              >
                {{ cat.name }}
              </div>
            </div>

            <p v-if="categoryLoading" class="text-xs text-gray-500 mt-1">
              Loading categories…
            </p>
          </div>
        </div>

        <!-- LOCATION -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("location") }}
            <span class="text-red-500 ml-1">*</span>
            <span class="ml-2 text-xs text-gray-400">{{ t("required") }}</span>
          </label>

          <div class="grid md:grid-cols-2 gap-4 mt-1">
            <div class="relative">
              <input
                v-model="provinceInput"
                @click="fetchProvinces(provinceInput || '_')"
                :disabled="form.is_remote"
                class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                :placeholder="t('province')"
              />
              <div
                v-if="provinceOptions.length"
                class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto"
              >
                <div
                  v-for="province in provinceOptions"
                  :key="province.id"
                  @click="selectProvince(province)"
                  class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                >
                  {{ province.name }}
                </div>
              </div>
              <p v-if="provinceLoading" class="text-xs text-gray-500 mt-1">
                Loading provinces...
              </p>
            </div>

            <div class="relative">
              <input
                v-model="cityInput"
                @click="fetchCities(cityInput || '_')"
                :disabled="form.is_remote || !selectedProvinceId || provinceInput.toLowerCase() === 'other countries'"
                class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                :placeholder="t('city')"
              />
              <div
                v-if="cityOptions.length"
                class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto"
              >
                <div
                  v-for="city in cityOptions"
                  :key="city.id"
                  @click="selectCity(city)"
                  class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                >
                  {{ city.name }}
                </div>
              </div>
              <p v-if="cityLoading" class="text-xs text-gray-500 mt-1">
                Loading cities...
              </p>
            </div>
          </div>

          <!-- REMOTE WORK CHECKBOX -->
          <div class="mt-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="form.is_remote"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Remote Work</span>
            </label>
          </div>
        </div>

        <!-- SKILLS -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Skills Required
            <span class="ml-2 text-xs text-gray-400">{{ t("optional") }}</span>
          </label>

          <!-- SELECTED SKILLS -->
          <div class="flex gap-2 flex-wrap mt-2">
            <span
              v-for="skill in skills"
              :key="skill.id"
              @click="deleteSkill(skill.id)"
              class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-green-200"
            >
              {{ skill.name || skill.skill_name }} ×
            </span>
          </div>

          <!-- ADD SKILLS BUTTON -->
          <button
            type="button"
            @click="openSkillModal"
            class="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
          >
            + Add Skills
          </button>
        </div>

        <!-- REQUIREMENTS -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("requirements") }}
            <span class="ml-2 text-xs text-gray-400">{{ t("optional") }}</span>
          </label>
          <div class="mt-2 space-y-2">
            <div
              v-for="(req, index) in form.requirements"
              :key="index"
              class="flex items-center gap-2"
            >
              <span class="text-sm text-gray-700 flex-1"
                >{{ index + 1 }}. {{ req.requirement }}</span
              >
              <button
                type="button"
                @click="removeRequirement(index)"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <input
              v-model="newRequirement"
              @keydown.enter.prevent="addRequirement"
              class="flex-1 border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('add_requirement')"
            />
            <button
              type="button"
              @click="addRequirement"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              {{ t("add") }}
            </button>
          </div>
        </div>

        <!-- RESPONSIBILITIES -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("responsibilities") }}
            <span class="ml-2 text-xs text-gray-400">{{ t("optional") }}</span>
          </label>
          <div class="mt-2 space-y-2">
            <div
              v-for="(resp, index) in form.responsibilities"
              :key="index"
              class="flex items-center gap-2"
            >
              <span class="text-sm text-gray-700 flex-1"
                >{{ index + 1 }}. {{ resp.responsibility }}</span
              >
              <button
                type="button"
                @click="removeResponsibility(index)"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <input
              v-model="newResponsibility"
              @keydown.enter.prevent="addResponsibility"
              class="flex-1 border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('add_responsibility')"
            />
            <button
              type="button"
              @click="addResponsibility"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              {{ t("add") }}
            </button>
          </div>
        </div>

        <!-- BENEFITS -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("benefits") }}
            <span class="ml-2 text-xs text-gray-400">{{ t("optional") }}</span>
          </label>
          <div class="mt-2 space-y-2">
            <div
              v-for="(ben, index) in form.benefits"
              :key="index"
              class="flex items-center gap-2"
            >
              <span class="text-sm text-gray-700 flex-1"
                >{{ index + 1 }}. {{ ben.benefit }}</span
              >
              <button
                type="button"
                @click="removeBenefit(index)"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <input
              v-model="newBenefit"
              @keydown.enter.prevent="addBenefit"
              class="flex-1 border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('add_benefit')"
            />
            <button
              type="button"
              @click="addBenefit"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              {{ t("add") }}
            </button>
          </div>
        </div>

        <!-- QUESTIONS -->
        <div>
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-700">
              {{ t("questions") }}
              <span class="ml-2 text-xs text-gray-400">{{
                t("optional")
              }}</span>
            </label>
            <button
              type="button"
              @click="addQuestion"
              class="text-sm text-blue-600 hover:text-blue-700"
            >
              + {{ t("add_question") }}
            </button>
          </div>

          <div
            v-if="form.job_post_questions && form.job_post_questions.length"
            class="mt-3 space-y-4"
          >
            <div
              v-for="(q, index) in form.job_post_questions"
              :key="index"
              class="rounded-md shadow-sm p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">
                  {{ t("question") }} {{ index + 1 }}
                </span>
                <button
                  type="button"
                  @click="removeQuestion(index)"
                  class="text-xs text-red-500 hover:text-red-700"
                >
                  {{ t("remove") }}
                </button>
              </div>

              <input
                v-model="q.question_text"
                class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :placeholder="t('question_text')"
              />

              <div class="grid md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">
                    {{ t("question_type") }}
                  </label>
                  <select
                    v-model="q.question_type_id"
                    @change="handleQuestionTypeChange(q)"
                    class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option
                      v-for="type in QUESTION_TYPES"
                      :key="type.id"
                      :value="type.id"
                    >
                      {{
                        t(
                          type.id === 1
                            ? "type_text"
                            : type.id === 2
                            ? "type_rating"
                            : type.id === 3
                            ? "type_multiple_choice"
                            : type.id === 4
                            ? "type_boolean"
                            : "type_options",
                        )
                      }}
                    </option>
                  </select>
                </div>

                <div class="md:col-span-2">
                  <label class="block text-xs text-gray-600 mb-1">
                    {{ t("options") }}
                  </label>
                  <input
                    v-model="q.optionsText"
                    :disabled="!needsOptions(q.question_type_id)"
                    class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :placeholder="t('options_placeholder')"
                  />
                </div>
              </div>

              <label class="flex items-center gap-2 mt-3 text-sm text-gray-700">
                <input type="checkbox" v-model="q.is_required" />
                {{ t("required") }}
              </label>
            </div>
          </div>
        </div>

        <!-- DESCRIPTION -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("job_description") }}
            <span class="text-red-500 ml-1">*</span>
            <span class="ml-2 text-xs text-gray-400">{{ t("required") }}</span>
          </label>
          <textarea
            v-model="form.description"
            class="mt-1 w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-37.5"
            :placeholder="t('job_description_placeholder')"
          />
        </div>

        <!-- SUBMIT -->
        <div class="pt-1 flex justify-end">
          <button
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-md"
          >
            {{ t("post_job") }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Skills Modal -->
  <div
    v-if="showSkillModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeSkillModal"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Add Skills</h3>
        <button
          @click="closeSkillModal"
          class="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      <!-- Search Input -->
      <input
        v-model="skillSearchQuery"
        @input="handleSkillSearch"
        @keydown.enter.prevent="handleSkillEnter"
        type="text"
        placeholder="Search or create skill..."
        class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
      />

      <!-- Suggestions -->
      <div
        v-if="skillSuggestions.length"
        class="space-y-2 mb-4 max-h-48 overflow-y-auto"
      >
        <div
          v-for="skill in skillSuggestions"
          :key="skill.id"
          @click="addSkillFromSuggestion(skill)"
          class="p-2 border border-gray-200 rounded cursor-pointer hover:bg-blue-50 text-sm"
        >
          {{ skill.name }}
        </div>
      </div>

      <!-- Create New Skill -->
      <div v-if="skillSearchQuery && !skillSuggestions.length" class="mb-3">
        <button
          @click="createAndAddSkill(skillSearchQuery)"
          class="w-full p-2 border-2 border-dashed border-green-300 rounded text-sm text-green-700 hover:bg-green-50"
        >
          + Create "{{ skillSearchQuery }}"
        </button>
      </div>

      <!-- Loading -->
      <p v-if="loadingSkills" class="text-xs text-gray-500 text-center">
        Loading skills...
      </p>

      <!-- Close Button -->
      <button
        @click="closeSkillModal"
        class="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
      >
        Done
      </button>
    </div>
  </div>
</template>
