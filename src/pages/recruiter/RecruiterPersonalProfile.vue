<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore.js";
import {
  getMyRecruiterProfile,
  updateMyRecruiterProfile,
  getRecruiterByUserId,
} from "@/services/recruiters.api.js";
import CompanyLogo from "@/components/common/CompanyLogo.vue";
import { resolveUploadUrl } from "@/utils/mediaUrl";
import { isContentRejectedError } from "@/utils/apiErrors";

const auth = useAuthStore();
const { t } = useI18n();

const form = reactive({ contact_name: "", contact_phone: "" });
const avatarFile = ref(null);
const avatarPreview = ref(null);
const avatarFromBackend = ref(null);
const loading = ref(false);
const saving = ref(false);

const avatarSrc = computed(
  () => avatarPreview.value || resolveUploadUrl(avatarFromBackend.value) || "",
);

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600";
const labelClass = "block text-sm font-medium text-slate-800 mb-1.5";
const helperClass = "mt-1.5 text-xs text-slate-500";

function applyProfile(data = {}) {
  form.contact_name = data.contact_name ?? "";
  form.contact_phone = data.contact_phone ?? "";
  avatarFromBackend.value = data.avatar_url || data.avatar || null;
}

function onAvatarChange(e) {
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
    avatarFile.value = file;
    avatarPreview.value = url;
  };
  img.src = url;
}

async function loadProfile() {
  loading.value = true;
  try {
    let data;
    try {
      data = await getMyRecruiterProfile();
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
      data = await getRecruiterByUserId(auth.user?.user_id || auth.user?.id);
    }
    applyProfile(data);
  } catch (err) {
    console.error(err);
    push.error(err?.response?.data?.message || "Failed to load profile");
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append("contact_name", form.contact_name);
    fd.append("contact_phone", form.contact_phone);
    if (avatarFile.value) fd.append("avatar", avatarFile.value);

    try {
      const updated = await updateMyRecruiterProfile(fd);
      applyProfile(updated || form);
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
      await api.put("/users/recruiters", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    push.success(t("notifications.profileUpdated") || "Profile updated");
  } catch (err) {
    if (isContentRejectedError(err)) {
      push.warning(t("contentRejected.upload") || "Content rejected");
      return;
    }
    push.error(
      err?.response?.data?.message ||
        t("notifications.failedToUpdateProfile") ||
        "Save failed",
    );
  } finally {
    saving.value = false;
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
          {{ t("recruiterPersonal.title") || "Personal profile" }}
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          {{ t("recruiterPersonal.subtitle") || "Your contact details as the company PIC" }}
        </p>
        <RouterLink
          to="/recruiter/company"
          class="inline-block mt-4 text-sm font-medium text-blue-600 hover:underline"
        >
          {{ t("recruiterPersonal.backToCompany") || "← Back to company settings" }}
        </RouterLink>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>

      <form v-else class="space-y-6" @submit.prevent="saveProfile">
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">
            {{ t("recruiterPersonal.avatar") || "Personal photo" }}
          </h2>
          <div class="flex flex-col sm:flex-row sm:items-center gap-5">
            <CompanyLogo
              size="hero"
              rounded="rounded-2xl"
              :src="avatarSrc"
              :alt="form.contact_name || 'Avatar'"
              fallback="initials"
            />
            <div class="flex-1 min-w-0">
              <label :class="labelClass">{{ t("recruiterPersonal.uploadAvatar") || "Upload photo" }}</label>
              <input
                type="file"
                accept="image/*"
                class="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-h-11 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
                @change="onAvatarChange"
              />
              <p :class="helperClass">{{ t("recruiterEdit.logoHint") || "Max 500 KB, min 128×128 px" }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-5">
            {{ t("recruiterEdit.sectionContact") || "Contact" }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label :class="labelClass">{{ t("contactName") || "Contact name" }}</label>
              <input v-model="form.contact_name" :class="inputClass" type="text" autocomplete="name" required />
            </div>
            <div>
              <label :class="labelClass">{{ t("contactPhone") || "Contact phone" }}</label>
              <input v-model="form.contact_phone" :class="inputClass" type="tel" autocomplete="tel" required />
            </div>
          </div>
        </section>

        <div class="flex justify-end pt-2">
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
