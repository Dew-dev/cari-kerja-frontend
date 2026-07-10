<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { push } from "notivue";
import { useI18n } from "vue-i18n";
import api from "@/services/api";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

onMounted(async () => {
  const token = route.query.token;
  const refreshToken = route.query.refreshToken;
  const userStr = route.query.user;

  if (!token || !refreshToken) {
    push.error(t("auth.messages.invalidToken") || "Authentication failed or parameters missing.");
    router.push("/login");
    return;
  }

  try {
    // Save tokens to local storage and update auth store first
    auth.token = token;
    auth.refreshToken = refreshToken;
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);

    let user = null;
    if (userStr) {
      user = JSON.parse(decodeURIComponent(userStr));
    } else {
      // Fetch user profile from the backend using the new token
      const profileRes = await api.get("/users/workers/me");
      const workerData = profileRes.data.data;
      user = {
        id: workerData.id,
        user_id: workerData.user_id,
        name: workerData.name,
        email: workerData.email,
        avatar_url: workerData.avatar_url,
        role: "user"
      };
    }

    // Save the user details
    auth.user = user;
    localStorage.setItem("user", JSON.stringify(user));

    push.success("Login successful!");

    // Redirect directly to profile page
    router.push("/profile/edit");
  } catch (error) {
    console.error("Callback parsing error:", error);
    push.error("An error occurred during sign in.");
    auth.token = null;
    auth.refreshToken = null;
    auth.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
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
