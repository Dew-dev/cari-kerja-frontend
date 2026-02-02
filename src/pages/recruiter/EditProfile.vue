<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import api from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import SearchableSelect from "../../components/common/SearchableSelect.vue";

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
});

const industries = ref([]);
const industrySearch = ref("");
let industrySearchTimeout = null;
const avatarFile = ref(null);
const avatarPreview = ref(null);
const avatarFromBackend = ref(null);
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

  // validasi size 2MB
  if (file.size > 2 * 1024 * 1024) {
    push.warning("Max file size 2MB");
    return;
  }

  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
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

    if (avatarFile.value) {
      fd.append("avatar", avatarFile.value);
    }

    await api.put("/users/recruiters", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    push.success("Profile updated");
  } catch (err) {
    console.error("Save failed", err);
    push.error("Failed to update profile");
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="rounded-2xl border bg-white shadow-sm px-10 py-5">
      <div class="border-b px-6 py-4">
        <h1 class="text-xl font-semibold">Recruiter Profile</h1>
        <p class="text-sm text-gray-500">
          This information will be visible to candidates
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
              class="h-28 w-28 rounded-full overflow-hidden border bg-gray-100"
            >
              <img
                v-if="avatarPreview || avatarFromBackend"
                :src="
                  avatarPreview || `http://localhost:5000${avatarFromBackend}`
                "
                class="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1"> {{ t("companyLogo") }} </label>
            <input type="file" accept="image/*" @change="onLogoChange" class="text-sm w-full rounded-lg border px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p class="text-xs text-gray-500 mt-1">JPG or PNG, max 2MB</p>
          </div>
        </div>

        <input
          v-model="form.company_name"
          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Company Name"
        />
        <input
          v-model="form.company_website"
          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Company Website"
        />
        <input
          v-model="form.contact_name"
          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Contact Name"
        />
        <input
          v-model="form.contact_phone"
          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Contact Phone"
        />

        <textarea
          v-model="form.address"
          class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          placeholder="Company Address"
        />

        <!-- INDUSTRY (SEARCHABLE SELECT) -->
        <SearchableSelect
          :options="filteredIndustryOptions"
          :value="form.industry_id"
          placeholder="Select Industry"
          @change="(val) => (form.industry_id = String(val || ''))"
          @search="handleIndustrySearch"
        />

        <textarea
          v-model="form.description"
          class="w-full rounded-lg border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
          rows="4"
          placeholder="Company Description"
        />
        <div class="flex justify-end pt-4 border-t col-span-2">
            
          <RouterLink
            to="/change-password"
            class="rounded-xl bg-gray-200 px-6 py-2.5 text-sm font-semibold text-black hover:bg-gray-400 transition mx-2"
          >
            Change Password
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
