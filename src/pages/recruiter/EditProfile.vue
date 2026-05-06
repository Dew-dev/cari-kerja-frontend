<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore.js";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import SearchableSelect from "@/components/common/SearchableSelect.vue";

const auth = useAuthStore();
const { t } = useI18n();

/* =====================
   STATE
===================== */
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

const descWordCount = computed(() =>
  form.description.trim() === '' ? 0 : form.description.trim().split(/\s+/).length
)
const descWordCountColor = computed(() => {
  if (descWordCount.value < 80) return 'text-red-500'
  if (descWordCount.value > 130) return 'text-red-500'
  return 'text-green-600'
})

const industries = ref([]);
const industrySearch = ref("");
let industrySearchTimeout = null;
const avatarFile = ref(null);
const avatarPreview = ref(null);
const avatarFromBackend = ref(null);
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL;
const loading = ref(false);

const industryOptions = computed(() =>
  industries.value.map((i) => ({
    label: i.name,
    value: String(i.id),
  })),
);

const filteredIndustryOptions = computed(() => industryOptions.value);

const onLogoChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // max 500kb
  if (file.size > 500 * 1024) {
    push.warning(t("notifications.maxFileSize500KB") || "Ukuran foto maksimal 500 KB");
    e.target.value = '';
    return;
  }

  // min 256x256
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    if (img.width < 256 || img.height < 256) {
      push.warning(t("notifications.minImageSize256") || "Ukuran foto minimal 256x256 px");
      URL.revokeObjectURL(url);
      e.target.value = '';
      return;
    }
    avatarFile.value = file;
    avatarPreview.value = url;
  };
  img.src = url;
};
/* =====================
   LOAD DATA
===================== */
async function loadProfile() {
  try {
    loading.value = true;

    // recruiter profile
    const res = await api.get(`/users/${auth.user.id}/recruiters`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const r = res.data.data;
    console.log("Recruiter profile:", r);
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

/* =====================
   SAVE
===================== */
async function saveProfile() {
  try {
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
    push.error(err?.response?.data?.message || t("notifications.failedToUpdateProfile"));
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="rounded-2xl shadow-md bg-white px-10 py-5">
      <div class="border-b px-6 py-4">
        <h1 class="text-xl font-semibold">{{ t("recruiterProfile") }}</h1>
        <p class="text-sm text-gray-500">
          {{ t("visibleToCandidates") }}
        </p>
      </div>

      <div v-if="loading">Loading...</div>

      <form
        v-else
        @submit.prevent="saveProfile"
        class="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <!-- AVATAR -->
        <div class="flex items-center gap-6 pt-5 col-span-2">
          <div class="relative">
            <div
              class="h-28 w-28 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-gray-100"
            >
              <img
                v-if="avatarPreview || avatarFromBackend"
                :src="
                  avatarPreview || `${fileStorageUrl}${avatarFromBackend}`
                "
                class="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1"> {{ t("companyLogo") }} </label>
            <input type="file" accept="image/*" @change="onLogoChange" class="text-sm w-full rounded-lg border border-gray-200 shadow-sm px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="text-xs text-gray-500 mt-1">JPG/PNG, rasio 1:1, min. 256x256 px, maks. 500 KB</p>
          </div>
        </div>

        <input
          v-model="form.company_name"
          class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="t('companyName')"
        />
        <input
          v-model="form.company_website"
          class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="t('companyWebsite')"
        />
        <input
          v-model="form.contact_name"
          class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="t('contactName')"
        />
        <input
          v-model="form.contact_phone"
          class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="t('contactPhone')"
        />
        <input
          v-model="form.employee_count"
          type="number"
          min="1"
          class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :placeholder="'Jumlah Karyawan (Ex. 50)'"
        />
        <textarea
          v-model="form.address"
          class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          :placeholder="t('companyAddress')"
        />
        <input
          v-model="form.instagram_url"
          class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Instagram (https://instagram.com/...)"
        />
        <input
          v-model="form.tiktok_url"
          class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="TikTok (https://tiktok.com/@...)"
        />

        <!-- INDUSTRY (SEARCHABLE SELECT) -->
        <SearchableSelect
          :options="filteredIndustryOptions"
          :value="form.industry_id"
          :placeholder="t('selectIndustry')"
          @change="(val) => (form.industry_id = String(val || ''))"
          @search="handleIndustrySearch"
        />

        <div class="col-span-2">
          <textarea
            v-model="form.description"
            class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            :placeholder="t('companyDescription')"
          />
          <p class="text-xs mt-1" :class="descWordCountColor">
            {{ descWordCount }} kata
            <span class="text-gray-400 ml-1">(min. 80 – maks. 130)</span>
          </p>
        </div>
        <div class="flex justify-end pt-4 border-t col-span-2">
            
          <RouterLink
            to="/change-password"
            class="rounded-xl bg-gray-200 px-6 py-2.5 text-sm font-semibold text-black hover:bg-gray-400 transition mx-2"
          >
            {{ t("changePassword") }}
          </RouterLink>
          <button
            type="submit"
            class="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            {{ t("saveChanges") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
