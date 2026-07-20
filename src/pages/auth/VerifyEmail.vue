<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/services/api";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const success = ref(false);
const error = ref("");

onMounted(async () => {
  try {
    const token = route.query.token;
    const result = await api.get("/auth/verify-email", { params: { token } });
    if (!result.err) {
      success.value = true;
      if (result.data.role === "recruiter") {
        setTimeout(() => router.push("/recruiter-login"), 2000);
      } else {
        setTimeout(() => router.push("/login"), 2000);
      }
    }
  } catch (e) {
    error.value = t("auth.messages.invalidToken");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-6 rounded-2xl shadow max-w-sm w-full text-center">
      <p v-if="loading">{{ t("auth.buttons.verify") }}</p>
      <p v-else-if="success" class="text-green-600">
        {{ t("auth.messages.verificationSuccess") }}
      </p>
      <p v-else class="text-red-600">
        {{ error }}
      </p>
    </div>
  </div>
</template>
