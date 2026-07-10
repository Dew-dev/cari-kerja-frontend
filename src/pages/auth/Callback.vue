<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { push } from "notivue";
import { useI18n } from "vue-i18n";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

onMounted(async () => {
  const token = route.query.token;
  const refreshToken = route.query.refreshToken;
  const userStr = route.query.user;

  if (!token || !refreshToken || !userStr) {
    push.error(t("auth.messages.invalidToken") || "Authentication failed or parameters missing.");
    router.push("/login");
    return;
  }

  try {
    const user = JSON.parse(decodeURIComponent(userStr));

    // Save tokens and user to local storage and update auth store
    auth.token = token;
    auth.refreshToken = refreshToken;
    auth.user = user;

    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    push.success("Login successful!");

    // Role-based redirect
    if (user.role === "recruiter") {
      router.push("/recruiter/jobs");
    } else {
      router.push("/jobposts");
    }
  } catch (error) {
    console.error("Callback parsing error:", error);
    push.error("An error occurred during sign in.");
    router.push("/login");
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p class="text-lg font-semibold text-gray-700">{{ t("auth.buttons.redirecting") || "Redirecting to your account..." }}</p>
    </div>
  </div>
</template>

<style scoped>
header {
  display: none;
}
footer {
  display: none;
}
</style>
