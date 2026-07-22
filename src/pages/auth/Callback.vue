<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { push } from "notivue";
import { useI18n } from "vue-i18n";
import api from "@/services/api";
import { decodeAccessToken } from "@/utils/jwt";
import { displayEmail } from "@/utils/authFlags";
import { resolveRecruiterLandingPath } from "@/utils/recruiterLanding";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

function resolveLoginProvider(decoded) {
  return decoded?.login_provider || "local";
}

function buildUserFromToken(token) {
  const decoded = decodeAccessToken(token) || {};
  const provider = resolveLoginProvider(decoded);
  const roleId = Number(decoded.role_id);

  if (roleId === 2) {
    return {
      id: decoded.recruiter_id || decoded.id,
      user_id: decoded.id,
      name: decoded.name || decoded.contact_name || "",
      email: displayEmail(decoded.email),
      avatar_url: decoded.avatar_url || null,
      role: "recruiter",
      login_provider: provider,
    };
  }

  return {
    id: decoded.worker_id || decoded.id,
    user_id: decoded.id,
    name: decoded.name || "",
    email: displayEmail(decoded.email),
    avatar_url: decoded.avatar_url || null,
    role: "user",
    login_provider: provider,
  };
}

async function enrichUserProfile(token) {
  const decoded = decodeAccessToken(token) || {};
  try {
    if (Number(decoded.role_id) === 2) {
      const profileRes = await api.get(`/users/${decoded.id}/recruiters`);
      const recruiterData = profileRes.data?.data;
      if (!recruiterData) return;
      auth.mergeUser({
        id: recruiterData.id,
        user_id: recruiterData.user_id,
        name:
          recruiterData.contact_name ||
          recruiterData.company_name ||
          auth.user?.name,
        email: displayEmail(decoded.email || recruiterData.email),
        avatar_url: recruiterData.avatar_url,
        role: "recruiter",
        login_provider:
          auth.user?.login_provider ||
          decoded.login_provider ||
          resolveLoginProvider(decoded),
      });
      return;
    }

    const profileRes = await api.get("/users/workers/me");
    const workerData = profileRes.data?.data;
    if (!workerData) return;
    auth.mergeUser({
      id: workerData.id,
      user_id: workerData.user_id,
      name: workerData.name || auth.user?.name,
      email: displayEmail(workerData.email),
      avatar_url: workerData.avatar_url,
      role: "user",
      login_provider:
        auth.user?.login_provider ||
        decoded.login_provider ||
        resolveLoginProvider(decoded),
    });
  } catch (error) {
    console.warn("Profile enrichment after OAuth failed:", error);
  }
}

onMounted(async () => {
  const token = route.query.token;
  const refreshToken = route.query.refreshToken;
  const userStr = route.query.user;

  if (!token || !refreshToken) {
    push.error(
      t("auth.messages.invalidToken") ||
        "Authentication failed or parameters missing.",
    );
    router.replace("/login");
    return;
  }

  try {
    auth.token = token;
    auth.$patch({ refreshToken });
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);

    let user = null;
    if (userStr && userStr !== "undefined") {
      try {
        user = JSON.parse(decodeURIComponent(userStr));
      } catch {
        user = null;
      }
    }
    if (!user) {
      user = buildUserFromToken(token);
    } else {
      user = {
        ...user,
        email: displayEmail(user.email),
        login_provider:
          user.login_provider || resolveLoginProvider(decodeAccessToken(token)),
      };
    }

    auth.user = user;
    localStorage.setItem("user", JSON.stringify(auth.user));

    // Ambil nama profil SEBELUM redirect (jangan biarkan header kosong)
    await enrichUserProfile(token);

    // Refresh untuk dapat restricted_verification + lengkapi JWT
    try {
      await auth.refreshToken({ logoutOnFail: false });
      if (!auth.user?.name) {
        await enrichUserProfile(auth.token || token);
      }
    } catch (refreshError) {
      console.warn(
        "OAuth token refresh failed, continuing with initial token:",
        refreshError,
      );
    }

    let destination = "/jobposts";
    if (auth.user.role === "recruiter") {
      destination = auth.restrictedVerification
        ? "/recruiter/verification"
        : await resolveRecruiterLandingPath();
    }

    push.success(t("auth.messages.loginSuccess") || "Login successful!");
    await router.replace(destination);
  } catch (error) {
    console.error("Callback parsing error:", error);
    push.error(
      t("auth.messages.signInError") || "An error occurred during sign in.",
    );
    auth.logout();
    router.replace("/login");
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
        {{ t("auth.buttons.redirectingToApp") }}
      </p>
    </div>
  </div>
</template>
