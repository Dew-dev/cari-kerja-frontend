<script setup>
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../../stores/authstore";

const { t } = useI18n();
const auth = useAuthStore();
import api from "@/services/api"; // axios instance

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
  // country: "",
  // city: "",
  description: "",
});

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

async function fetchCurrencies(keyword = "UZS") {
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
   SUBMIT
====================== */
async function submit() {
  const payload = {
    ...form,
    recruiter_id: auth.user?.recruiter_id,
    tags: form.tags,
    location: `${form.country},${form.city}`,
    job_post_status_id: 1, // default to 'open'
    category_id: form.category_id,
  };

  console.log("CREATE JOB PAYLOAD:", payload);
  // TODO: POST /jobs
  const res = await api.post("/job-posts", payload, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  console.log(res);
  if (!res?.success) {
    return;
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
        Fill in the details to publish a new job vacancy
      </p>

      <form @submit.prevent="submit" class="space-y-6">
        <!-- JOB TITLE -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("job_title") }}
          </label>
          <input
            v-model="form.title"
            class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :placeholder="t('job_title_placeholder')"
          />
        </div>

        <!-- TAGS -->
        <!-- TAGS -->
        <div class="relative">
          <label class="block text-sm font-medium text-gray-700">
            {{ t("tags") }}
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
            class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :placeholder="t('add_tag')"
            @keydown.enter.prevent="addTag"
          />

          <!-- DROPDOWN -->
          <div
            v-if="tagInput"
            class="absolute z-10 bg-white border w-full mt-1 max-h-48 overflow-y-auto"
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
          </label>

          <div class="grid md:grid-cols-3 gap-4 mt-1">
            <input
              v-model="form.salary_min"
              type="number"
              class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('min_salary')"
              @input="validateSalary"
            />

            <input
              v-model="form.salary_max"
              type="number"
              class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('max_salary')"
              @input="validateSalary"
            />

            <div class="relative">
              <input
                v-model="currencyInput"
                ref="currencyInputRef"
                class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                :placeholder="t('select_currency')"
                @click="fetchCurrencies()"
              />

              <!-- DROPDOWN -->
              <div
                v-if="currencyOptions.length"
                class="absolute z-10 bg-white border w-full mt-1 max-h-48 overflow-y-auto"
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
            <label>{{ t("job_type") }}</label>
            <select
              v-model="form.employment_type_id"
              class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label>{{ t("job_level") }}</label>
            <select
              v-model="form.experience_level_id"
              class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{{ t("select") }}</option>
              <option value="1">Fresh Graduate</option>
              <option value="2">Junior</option>
              <option value="3">Middle</option>
              <option value="4">Senior</option>
            </select>
          </div>

          <div class="col-span-2">
            <label>{{ t("deadline") }}</label>
            <input
              v-model="form.deadline"
              type="date"
              class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <!-- CATEGORY -->
          <div class="col-span-2 relative">
            <label class="block text-sm font-medium text-gray-700">
              {{ t("category") }}
            </label>

            <input
              v-model="categoryInput"
              class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('select_category')"
            />

            <!-- DROPDOWN -->
            <div
              v-if="categoryOptions.length"
              class="absolute z-10 bg-white border w-full mt-1 max-h-48 overflow-y-auto"
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
          </label>

          <div class="grid md:grid-cols-2 gap-4 mt-1">
            <input
              v-model="form.country"
              class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('country')"
            />
            <input
              v-model="form.city"
              class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('city')"
            />
          </div>
        </div>

        <!-- DESCRIPTION -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            {{ t("job_description") }}
          </label>
          <textarea
            v-model="form.description"
            class="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
            :placeholder="t('job_description_placeholder')"
          />
        </div>

        <!-- SUBMIT -->
        <div class="pt-1  flex justify-end">
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
</template>
