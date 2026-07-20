<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { push } from "notivue";
import { useI18n } from "vue-i18n";
import api from "@/services/api";
import { decodeAccessToken } from "@/utils/jwt";
import { displayEmail, isFlagTruthy } from "@/utils/authFlags";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const status = ref("loading");

onMounted(async () => {
  const token = route.query.token;
  const refreshToken = route.query.refreshToken;
  const userStr = route.query.user;

  if (!token || !refreshToken) {
    push.error(
      t("auth.messages.invalidToken") ||
        "Authentication failed or parameters missing.",
    );
    router.push("/login");
    return;
  }

  try {
    auth.token = token;
    auth.$patch({ refreshToken });
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);

    // Flags dari query OAuth (banner, bukan gate)
    auth.applyNotificationFlags({
      requires_email_setup: route.query.requires_email_setup,
      requires_email_update: route.query.requires_email_update,
      requires_telegram_link: route.query.requires_telegram_link,
    });

    try {
      await auth.refreshToken({ logoutOnFail: false });
    } catch (refreshError) {
      console.warn(
        "OAuth token refresh failed, continuing with initial token:",
        refreshError,
      );
    }

    let user = null;
    if (userStr && userStr !== "undefined") {
      user = JSON.parse(decodeURIComponent(userStr));
    } else {
      const decoded = decodeAccessToken(auth.token || token);
      if (decoded && Number(decoded.role_id) === 2) {
        const profileRes = await api.get(`/users/${decoded.id}/recruiters`);
        const recruiterData = profileRes.data.data;
        user = {
          id: recruiterData.id,
          user_id: recruiterData.user_id,
          name:
            recruiterData.contact_name ||
            recruiterData.company_name ||
            decoded.name ||
            "Recruiter",
          email: displayEmail(decoded.email || recruiterData.email),
          avatar_url: recruiterData.avatar_url,
          role: "recruiter",
          login_provider: decoded.login_provider || "google",
        };
      } else {
        const profileRes = await api.get("/users/workers/me");
        const workerData = profileRes.data.data;
        user = {
          id: workerData.id,
          user_id: workerData.user_id,
          name: workerData.name,
          email: displayEmail(workerData.email),
          avatar_url: workerData.avatar_url,
          role: "user",
          login_provider:
            decoded?.login_provider ||
            (isFlagTruthy(route.query.requires_email_setup)
              ? "telegram"
              : isFlagTruthy(route.query.requires_telegram_link)
                ? "google"
                : "local"),
        };
      }
    }

    // Jangan force page "lengkapi email" — masuk app langsung
    auth.user = {
      ...user,
      email: displayEmail(user.email),
      login_provider:
        user.login_provider ||
        decodeAccessToken(auth.token)?.login_provider ||
        auth.loginProvider,
    };
    localStorage.setItem("user", JSON.stringify(auth.user));

    // Pastikan flag query tetap dihormati jika refresh tidak mengembalikannya
    if (isFlagTruthy(route.query.requires_email_setup)) {
      auth.applyNotificationFlags({ requires_email_setup: true });
    }
    if (isFlagTruthy(route.query.requires_telegram_link)) {
      auth.applyNotificationFlags({ requires_telegram_link: true });
    }

    status.value = "done";
    push.success(t("auth.messages.loginSuccess") || "Login successful!");

    if (auth.user.role === "recruiter") {
      router.replace("/recruiter/jobs");
    } else {
      router.replace("/jobposts");
    }
  } catch (error) {
    console.error("Callback parsing error:", error);
    push.error(t("auth.messages.signInError") || "An error occurred during sign in.");
    auth.logout();
    router.push("/login");
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
  >
    <div class="text-center">
      <div
        class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
      ></div>
      <p class="text-lg font-semibold text-gray-700">
        {{ t("auth.buttons.redirecting") || "Redirecting to your account..." }}
      </p>
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
