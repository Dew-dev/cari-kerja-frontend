<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore.js";

const router = useRouter();
const auth = useAuthStore();

const { t } = useI18n();

const loading = ref(false);
const error = ref("");
const success = ref(false);

const form = reactive({
  current_password: "",
  new_password: "",
  confirm_password: "",
});

async function submit() {
  if (form.new_password !== form.confirm_password) {
    error.value = t("profile.changePasswordPage.mismatch");
    return;
  }

  try {
    loading.value = true;
    error.value = "";

    await api.post(
      "/auth/change-password",
      {
        current_password: form.current_password,
        new_password: form.new_password,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    success.value = true;

    // logout paksa
    setTimeout(() => {
      auth.logout();
      router.push("/login");
    }, 1500);
  } catch (e) {
    error.value =
      e?.response?.data?.message || t("profile.changePasswordPage.failed");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="bg-slate-50 min-h-screen py-10 md:py-16 px-4">
    <div class="max-w-md mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-slate-900">
          {{ t("profile.changePasswordPage.title") }}
        </h2>
        <p class="text-sm text-slate-500 mt-1">
          {{ t("profile.changePasswordPage.subtitle") }}
        </p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            {{ t("profile.changePasswordPage.currentPassword") }}
          </label>
          <input
            v-model="form.current_password"
            type="password"
            :placeholder="t('profile.changePasswordPage.currentPassword')"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            required
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            {{ t("profile.changePasswordPage.newPassword") }}
          </label>
          <input
            v-model="form.new_password"
            type="password"
            :placeholder="t('profile.changePasswordPage.newPassword')"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            required
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            {{ t("profile.changePasswordPage.confirmPassword") }}
          </label>
          <input
            v-model="form.confirm_password"
            type="password"
            :placeholder="t('profile.changePasswordPage.confirmPassword')"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            required
          />
        </div>

        <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {{ error }}
        </p>

        <p v-if="success" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          {{ t("profile.changePasswordPage.success") }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition duration-200 min-h-11 disabled:opacity-50"
        >
          {{
            loading
              ? t("profile.changePasswordPage.saving")
              : t("profile.changePasswordPage.submit")
          }}
        </button>
      </form>
    </div>
  </div>
</template>
