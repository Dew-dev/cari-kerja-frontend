<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useAuthStore } from "@/stores/authStore.js";
import {
  previewCompanyInvitation,
  acceptCompanyInvitation,
} from "@/services/companies.api.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const token = computed(() => String(route.query.token || "").trim());
const loading = ref(true);
const accepting = ref(false);
const preview = ref(null);
const error = ref(null);

const isLoggedInRecruiter = computed(
  () => auth.isLoggedIn && auth.role === "recruiter",
);

const redirectAfterLogin = computed(() => {
  const path = `/invite/accept?token=${encodeURIComponent(token.value)}`;
  return `/recruiter-login?redirect=${encodeURIComponent(path)}`;
});

const registerUrl = computed(
  () => `/register-recruiter?invite_token=${encodeURIComponent(token.value)}`,
);

function formatExpiry(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

async function loadPreview() {
  loading.value = true;
  error.value = null;
  preview.value = null;
  if (!token.value) {
    error.value = t("acceptInvite.missingToken") || "Invitation token is missing.";
    loading.value = false;
    return;
  }
  try {
    preview.value = await previewCompanyInvitation(token.value);
  } catch (err) {
    error.value =
      err?.response?.data?.message ||
      t("acceptInvite.invalid") ||
      "This invitation is invalid or has expired.";
  } finally {
    loading.value = false;
  }
}

async function onAccept() {
  if (!isLoggedInRecruiter.value || !token.value) return;
  accepting.value = true;
  try {
    await acceptCompanyInvitation(token.value);
    await auth.refreshSession({ logoutOnFail: false });
    push.success(t("acceptInvite.accepted") || "You joined the company");
    router.push("/recruiter/jobs");
  } catch (err) {
    push.error(
      err?.response?.data?.message ||
        t("acceptInvite.acceptFailed") ||
        "Failed to accept invitation",
    );
  } finally {
    accepting.value = false;
  }
}

onMounted(loadPreview);
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
      <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">
        {{ t("acceptInvite.title") || "Company invitation" }}
      </h1>
      <p class="mt-2 text-sm text-slate-500">
        {{ t("acceptInvite.subtitle") || "Join a recruiter team on Cari Kerja" }}
      </p>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>

      <div
        v-else-if="error"
        class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        {{ error }}
      </div>

      <div v-else-if="preview" class="mt-6 space-y-4">
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="text-slate-500">{{ t("acceptInvite.company") || "Company" }}</dt>
            <dd class="font-medium text-slate-900">
              {{ preview.company_name || preview.company?.company_name || "—" }}
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">{{ t("acceptInvite.role") || "Role" }}</dt>
            <dd class="font-medium text-slate-900 capitalize">{{ preview.role || "—" }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">{{ t("acceptInvite.email") || "Invited email" }}</dt>
            <dd class="font-medium text-slate-900">{{ preview.email || "—" }}</dd>
          </div>
          <div v-if="preview.expires_at || preview.expires_at_iso">
            <dt class="text-slate-500">{{ t("acceptInvite.expires") || "Expires" }}</dt>
            <dd class="font-medium text-slate-900">
              {{ formatExpiry(preview.expires_at || preview.expires_at_iso) }}
            </dd>
          </div>
        </dl>

        <div class="pt-4 space-y-3">
          <button
            v-if="isLoggedInRecruiter"
            type="button"
            :disabled="accepting"
            class="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 min-h-11"
            @click="onAccept"
          >
            {{ accepting ? (t("loadingDots") || "…") : (t("acceptInvite.accept") || "Accept invitation") }}
          </button>

          <template v-else>
            <RouterLink
              :to="registerUrl"
              class="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 min-h-11"
            >
              {{ t("acceptInvite.register") || "Register as recruiter" }}
            </RouterLink>
            <RouterLink
              :to="redirectAfterLogin"
              class="w-full inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-11"
            >
              {{ t("acceptInvite.login") || "Log in" }}
            </RouterLink>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
