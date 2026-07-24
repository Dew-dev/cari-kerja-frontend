<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore.js";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import SearchableSelect from "@/components/common/SearchableSelect.vue";
import RichTextEditor from "@/components/common/RichTextEditor.vue";
import { isContentRejectedError } from "@/utils/apiErrors";

const auth = useAuthStore();
const { t } = useI18n();

const form = reactive({
  company_name: "",
  company_website: "",
  contact_name: "",
  contact_phone: "",
  address: "",
  industry_id: "",
  description: "",
  employee_count: "",
  instagram_url: "",
  tiktok_url: "",
});

const industries = ref([]);
const industrySearch = ref("");
let industrySearchTimeout = null;
const avatarFile = ref(null);
const avatarPreview = ref(null);
const avatarFromBackend = ref(null);
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL;
const loading = ref(false);
const saving = ref(false);

const industryOptions = computed(() =>
  industries.value.map((i) => ({
    label: i.name,
    value: String(i.id),
  })),
);

const filteredIndustryOptions = computed(() => industryOptions.value);

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600";
const labelClass = "block text-sm font-medium text-slate-800 mb-1.5";
const helperClass = "mt-1.5 text-xs text-slate-500";

const onLogoChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 500 * 1024) {
    push.warning(t("notifications.maxFileSize500KB") || "Ukuran foto maksimal 500 KB");
    e.target.value = "";
    return;
  }

  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    if (img.width < 128 || img.height < 128) {
      push.warning(t("notifications.minImageSize128") || "Ukuran foto minimal 128x128 px");
      URL.revokeObjectURL(url);
      e.target.value = "";
      return;
    }
    avatarFile.value = file;
    avatarPreview.value = url;
  };
  img.src = url;
};

async function loadProfile() {
  try {
    loading.value = true;

    const res = await api.get(`/users/${auth.user.id}/recruiters`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const r = res.data.data;
    form.company_name = r.company_name ?? "";
    form.company_website = r.company_website ?? "";
    form.contact_name = r.contact_name ?? "";
    form.contact_phone = r.contact_phone ?? "";
    form.address = r.address ?? "";
    form.industry_id = r.industry_id ? String(r.industry_id) : "";
    form.description = r.description ?? "";
    form.employee_count = r.employee_count ?? "";
    form.instagram_url = r.instagram_url ?? "";
    form.tiktok_url = r.tiktok_url ?? "";

    if (r.avatar_url) {
      avatarFromBackend.value = r.avatar_url;
    }

    await fetchIndustries();
  } catch (err) {
    console.error("Failed to load profile", err);
  } finally {
    loading.value = false;
  }
}

async function fetchIndustries(keyword = "") {
  try {
    const params = keyword ? { search: keyword } : {};
    const ind = await api.get("/industries", { params });
    industries.value = ind.data?.data || [];
  } catch (err) {
    console.error("Failed to load industries", err);
  }
}

function handleIndustrySearch(value) {
  industrySearch.value = value;

  if (industrySearchTimeout) {
    clearTimeout(industrySearchTimeout);
  }

  industrySearchTimeout = setTimeout(() => {
    fetchIndustries(value?.trim() || "");
  }, 300);
}

async function saveProfile() {
  try {
    saving.value = true;
    const fd = new FormData();

    fd.append("company_name", form.company_name);
    fd.append("company_website", form.company_website);
    fd.append("contact_name", form.contact_name);
    fd.append("contact_phone", form.contact_phone);
    fd.append("address", form.address);
    fd.append("industry_id", form.industry_id);
    fd.append("description", form.description);
    fd.append("employee_count", form.employee_count);
    fd.append("instagram_url", form.instagram_url);
    fd.append("tiktok_url", form.tiktok_url);

    if (avatarFile.value) {
      fd.append("avatar", avatarFile.value);
    }

    await api.put("/users/recruiters", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    push.success(t("notifications.profileUpdated"));
  } catch (err) {
    console.error("Save failed", err);
    if (isContentRejectedError(err)) {
      push.warning(t("contentRejected.upload"));
      return;
    }
    push.error(err?.response?.data?.message || t("notifications.failedToUpdateProfile"));
  } finally {
    saving.value = false;
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
          {{ t("recruiterProfile") }}
        </h1>
        <p class="mt-2 text-sm text-slate-500 leading-relaxed">
          {{ t("visibleToCandidates") }}
        </p>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex justify-center py-16"
      >
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <form
        v-else
        @submit.prevent="saveProfile"
        class="space-y-6"
      >
        <!-- Logo -->
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">
            {{ t("companyLogo") }}
          </h2>

          <div class="flex flex-col sm:flex-row sm:items-center gap-5">
            <div
              class="h-24 w-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center"
            >
              <img
                v-if="avatarPreview || avatarFromBackend"
                :src="avatarPreview || `${fileStorageUrl}${avatarFromBackend}`"
                class="h-full w-full object-contain"
                :alt="t('companyLogo')"
              />
              <span
                v-else
                class="text-2xl font-semibold text-slate-400"
              >
                {{ form.company_name?.charAt(0)?.toUpperCase() || "?" }}
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <label :class="labelClass">{{ t("recruiterEdit.uploadLogo") }}</label>
              <input
                type="file"
                accept="image/*"
                @change="onLogoChange"
                class="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-h-11 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
              />
              <p :class="helperClass">{{ t("recruiterEdit.logoHint") }}</p>
            </div>
          </div>
        </section>

        <!-- Company -->
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">
            {{ t("recruiterEdit.sectionCompany") }}
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label :class="labelClass">
                {{ t("profile.companyName") }}
                <span class="text-red-600">*</span>
              </label>
              <input
                v-model="form.company_name"
                :class="inputClass"
                type="text"
                autocomplete="organization"
              />
            </div>

            <div>
              <label :class="labelClass">
                {{ t("companyWebsite") }}
                <span class="ml-1 text-xs font-normal text-slate-400">({{ t("optional") }})</span>
              </label>
              <input
                v-model="form.company_website"
                :class="inputClass"
                type="url"
                placeholder="https://"
              />
            </div>

            <div>
              <label :class="labelClass">
                {{ t("selectIndustry") }}
                <span class="text-red-600">*</span>
              </label>
              <SearchableSelect
                :options="filteredIndustryOptions"
                :value="form.industry_id"
                :placeholder="t('selectIndustry')"
                @change="(val) => (form.industry_id = String(val || ''))"
                @search="handleIndustrySearch"
              />
            </div>

            <div>
              <label :class="labelClass">
                {{ t("recruiterEdit.employeeCount") }}
                <span class="ml-1 text-xs font-normal text-slate-400">({{ t("optional") }})</span>
              </label>
              <input
                v-model="form.employee_count"
                :class="inputClass"
                type="number"
                min="1"
                :placeholder="t('recruiterEdit.employeeCountPlaceholder')"
              />
            </div>
          </div>
        </section>

        <!-- Contact -->
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">
            {{ t("recruiterEdit.sectionContact") }}
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label :class="labelClass">
                {{ t("contactName") }}
                <span class="text-red-600">*</span>
              </label>
              <input
                v-model="form.contact_name"
                :class="inputClass"
                type="text"
                autocomplete="name"
              />
            </div>

            <div>
              <label :class="labelClass">
                {{ t("contactPhone") }}
                <span class="text-red-600">*</span>
              </label>
              <input
                v-model="form.contact_phone"
                :class="inputClass"
                type="tel"
                autocomplete="tel"
              />
            </div>

            <div class="sm:col-span-2">
              <label :class="labelClass">
                {{ t("companyAddress") }}
                <span class="text-red-600">*</span>
              </label>
              <textarea
                v-model="form.address"
                :class="inputClass"
                rows="3"
              />
            </div>
          </div>
        </section>

        <!-- Social -->
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">
            {{ t("recruiterEdit.sectionSocial") }}
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label :class="labelClass">
                {{ t("recruiterEdit.instagram") }}
                <span class="ml-1 text-xs font-normal text-slate-400">({{ t("optional") }})</span>
              </label>
              <input
                v-model="form.instagram_url"
                :class="inputClass"
                type="url"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label :class="labelClass">
                {{ t("recruiterEdit.tiktok") }}
                <span class="ml-1 text-xs font-normal text-slate-400">({{ t("optional") }})</span>
              </label>
              <input
                v-model="form.tiktok_url"
                :class="inputClass"
                type="url"
                placeholder="https://tiktok.com/@..."
              />
            </div>
          </div>
        </section>

        <!-- About -->
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">
            {{ t("recruiterEdit.sectionAbout") }}
          </h2>

          <div>
            <label :class="labelClass">
              {{ t("companyDescription") }}
              <span class="text-red-600">*</span>
            </label>
            <RichTextEditor
              v-model="form.description"
              :placeholder="t('companyDescription')"
              min-height="140px"
            />
          </div>
        </section>

        <!-- Actions -->
        <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <RouterLink
            to="/change-password"
            class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-200 min-h-11"
          >
            {{ t("changePassword") }}
          </RouterLink>
          <button
            type="submit"
            :disabled="saving"
            class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 min-h-11"
          >
            {{ saving ? t("loadingDots") : t("saveChanges") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
