<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore.js";
import { getMyCompany, updateMyCompany } from "@/services/companies.api.js";
import { getRecruiterByUserId } from "@/services/recruiters.api.js";
import SearchableSelect from "@/components/common/SearchableSelect.vue";
import RichTextEditor from "@/components/common/RichTextEditor.vue";
import CompanyLogo from "@/components/common/CompanyLogo.vue";
import { resolveUploadUrl } from "@/utils/mediaUrl";
import { isContentRejectedError } from "@/utils/apiErrors";

const auth = useAuthStore();
const { t } = useI18n();

const form = reactive({
  company_name: "",
  company_website: "",
  industry_id: "",
  employee_count: "",
  address: "",
  description: "",
  instagram_url: "",
  tiktok_url: "",
});

const companyMeta = reactive({ is_vip: false, verification_status: null, is_verified: null });
const industries = ref([]);
const logoFile = ref(null);
const logoPreview = ref(null);
const logoFromBackend = ref(null);
const loading = ref(false);
const saving = ref(false);
let industrySearchTimeout = null;

const canEdit = computed(() => auth.canEditCompany);
const logoSrc = computed(
  () => logoPreview.value || resolveUploadUrl(logoFromBackend.value) || "",
);

const industryOptions = computed(() =>
  industries.value.map((i) => ({ label: i.name, value: String(i.id) })),
);

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-500";
const labelClass = "block text-sm font-medium text-slate-800 mb-1.5";
const helperClass = "mt-1.5 text-xs text-slate-500";

function applyCompany(data = {}) {
  form.company_name = data.company_name ?? data.name ?? "";
  form.company_website = data.company_website ?? data.website ?? "";
  form.industry_id = data.industry_id != null ? String(data.industry_id) : "";
  form.employee_count = data.employee_count ?? "";
  form.address = data.address ?? "";
  form.description = data.description ?? "";
  form.instagram_url = data.instagram_url ?? "";
  form.tiktok_url = data.tiktok_url ?? "";
  logoFromBackend.value = data.logo_url || data.avatar_url || data.logo || null;
  companyMeta.is_vip = Boolean(data.is_vip);
  companyMeta.verification_status = data.verification_status ?? null;
  companyMeta.is_verified =
    data.is_verified != null ? Boolean(data.is_verified) : null;
}

async function fetchIndustries(keyword = "") {
  try {
    const ind = await api.get("/industries", { params: keyword ? { search: keyword } : {} });
    industries.value = ind.data?.data || [];
  } catch (err) {
    console.error("Failed to load industries", err);
  }
}

function handleIndustrySearch(value) {
  if (industrySearchTimeout) clearTimeout(industrySearchTimeout);
  industrySearchTimeout = setTimeout(() => fetchIndustries(value?.trim() || ""), 300);
}

function onLogoChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 500 * 1024) {
    push.warning(t("notifications.fileTooLarge", { size: "500 KB" }));
    e.target.value = "";
    return;
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    if (img.width < 128 || img.height < 128) {
      push.warning(t("notifications.minImageSize128") || "Minimum image size 128x128 px");
      URL.revokeObjectURL(url);
      e.target.value = "";
      return;
    }
    logoFile.value = file;
    logoPreview.value = url;
  };
  img.src = url;
}

async function loadCompany() {
  loading.value = true;
  try {
    let data;
    try {
      data = await getMyCompany();
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
      data = await getRecruiterByUserId(auth.user?.user_id || auth.user?.id);
    }
    applyCompany(data);
    await fetchIndustries();
  } catch (err) {
    console.error(err);
    push.error(err?.response?.data?.message || "Failed to load company");
  } finally {
    loading.value = false;
  }
}

function buildFormData() {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
  if (logoFile.value) {
    fd.append("logo", logoFile.value);
    fd.append("avatar", logoFile.value);
  }
  return fd;
}

async function saveCompany() {
  if (!canEdit.value) return;
  saving.value = true;
  try {
    const payload = logoFile.value
      ? buildFormData()
      : { ...form, industry_id: form.industry_id || null };
    try {
      const updated = await updateMyCompany(payload);
      applyCompany(updated || { ...form, logo_url: logoFromBackend.value });
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
      const fd = buildFormData();
      await api.put("/users/recruiters", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    push.success(t("notifications.profileUpdated") || "Company updated");
  } catch (err) {
    if (isContentRejectedError(err)) {
      push.warning(t("contentRejected.upload") || "Content rejected");
      return;
    }
    push.error(err?.response?.data?.message || t("notifications.failedToUpdateProfile") || "Save failed");
  } finally {
    saving.value = false;
  }
}

onMounted(loadCompany);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div class="mb-8">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            {{ t("companySettings.title") || "Company settings" }}
          </h1>
          <span
            v-if="companyMeta.is_vip"
            class="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
          >⭐ VIP</span>
          <span
            v-if="companyMeta.verification_status"
            class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 capitalize"
          >{{ companyMeta.verification_status }}</span>
          <span
            v-else-if="companyMeta.is_verified === true"
            class="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
          >{{ t("companySettings.verified") || "Verified" }}</span>
        </div>
        <p class="text-sm text-slate-500">{{ t("companySettings.subtitle") || "Manage your company profile" }}</p>
        <p v-if="!canEdit" class="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {{ t("companySettings.readOnly") || "You can view company details but only admins can edit." }}
        </p>
        <div class="mt-4 flex flex-wrap gap-3 text-sm">
          <RouterLink to="/recruiter/company/team" class="text-blue-600 hover:underline font-medium">
            {{ t("companySettings.teamLink") || "Manage team" }}
          </RouterLink>
          <RouterLink to="/recruiter/profile" class="text-blue-600 hover:underline font-medium">
            {{ t("companySettings.personalLink") || "Personal profile" }}
          </RouterLink>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>

      <form v-else class="space-y-6" @submit.prevent="saveCompany">
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">{{ t("companyLogo") || "Company logo" }}</h2>
          <div class="flex flex-col sm:flex-row sm:items-center gap-5">
            <CompanyLogo size="hero" rounded="rounded-2xl" :src="logoSrc" :alt="form.company_name" fallback="initials" />
            <div class="flex-1 min-w-0">
              <label :class="labelClass">{{ t("recruiterEdit.uploadLogo") || "Upload logo" }}</label>
              <input
                type="file"
                accept="image/*"
                :disabled="!canEdit"
                class="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-h-11 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 disabled:opacity-60"
                @change="onLogoChange"
              />
              <p :class="helperClass">{{ t("recruiterEdit.logoHint") || "Max 500 KB, min 128×128 px" }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">{{ t("recruiterEdit.sectionCompany") || "Company" }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label :class="labelClass">{{ t("profile.companyName") || "Company name" }}</label>
              <input v-model="form.company_name" :class="inputClass" type="text" :disabled="!canEdit" />
            </div>
            <div>
              <label :class="labelClass">{{ t("companyWebsite") || "Website" }}</label>
              <input v-model="form.company_website" :class="inputClass" type="url" placeholder="https://" :disabled="!canEdit" />
            </div>
            <div :class="{ 'pointer-events-none opacity-70': !canEdit }">
              <label :class="labelClass">{{ t("selectIndustry") || "Industry" }}</label>
              <SearchableSelect
                :options="industryOptions"
                :value="form.industry_id"
                :placeholder="t('selectIndustry') || 'Select industry'"
                @change="(val) => (form.industry_id = String(val || ''))"
                @search="handleIndustrySearch"
              />
            </div>
            <div>
              <label :class="labelClass">{{ t("recruiterEdit.employeeCount") || "Employee count" }}</label>
              <input v-model="form.employee_count" :class="inputClass" type="number" min="1" :disabled="!canEdit" />
            </div>
            <div class="sm:col-span-2">
              <label :class="labelClass">{{ t("companyAddress") || "Address" }}</label>
              <textarea v-model="form.address" :class="inputClass" rows="3" :disabled="!canEdit" />
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">{{ t("recruiterEdit.sectionSocial") || "Social" }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label :class="labelClass">{{ t("recruiterEdit.instagram") || "Instagram" }}</label>
              <input v-model="form.instagram_url" :class="inputClass" type="url" :disabled="!canEdit" />
            </div>
            <div>
              <label :class="labelClass">{{ t("recruiterEdit.tiktok") || "TikTok" }}</label>
              <input v-model="form.tiktok_url" :class="inputClass" type="url" :disabled="!canEdit" />
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">{{ t("recruiterEdit.sectionAbout") || "About" }}</h2>
          <div :class="{ 'pointer-events-none opacity-70': !canEdit }">
            <RichTextEditor v-model="form.description" :placeholder="t('companyDescription') || 'Description'" min-height="140px" />
          </div>
        </section>

        <div v-if="canEdit" class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 min-h-11"
          >
            {{ saving ? (t("loadingDots") || "Saving…") : (t("saveChanges") || "Save changes") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
