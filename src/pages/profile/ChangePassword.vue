<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authstore";

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
    error.value = t("profile.changePassword.mismatch");
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
      e?.response?.data?.message || t("profile.changePassword.failed");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-md bg-white rounded-2xl p-6 shadow mx-auto my-20">
    <h2 class="text-lg font-semibold mb-4">
      {{ t("profile.changePassword.title") }}
    </h2>

    <form @submit.prevent="submit" class="space-y-4">
      <input
        v-model="form.current_password"
        type="password"
        :placeholder="t('profile.changePassword.currentPassword')"
        class="w-full bg-gray-100 px-3 py-2 rounded"
        required
      />

      <input
        v-model="form.new_password"
        type="password"
        :placeholder="t('profile.changePassword.newPassword')"
        class="w-full bg-gray-100 px-3 py-2 rounded"
        required
      />

      <input
        v-model="form.confirm_password"
        type="password"
        :placeholder="t('profile.changePassword.confirmPassword')"
        class="w-full bg-gray-100 px-3 py-2 rounded"
        required
      />

      <p v-if="error" class="text-sm text-red-600">
        {{ error }}
      </p>

      <p v-if="success" class="text-sm text-green-600">
        {{ t("profile.changePassword.success") }}
      </p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-full disabled:opacity-50"
      >
        {{
          loading
            ? t("profile.changePassword.saving")
            : t("profile.changePassword.submit")
        }}
      </button>
    </form>
  </div>
</template>
