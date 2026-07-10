<script setup>
import { reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore.js";

import { push } from "notivue";
import { useI18n } from "vue-i18n";
import api from "@/services/api";
const { locale, t } = useI18n();
const loading = ref(false);
const showPassword = ref(false);
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});

async function submit() {
  const success = await auth.login(form);
  if (!success) return;

  // Check if there's a redirect query parameter
  const redirectTo = route.query.redirect;
  
  if (redirectTo) {
    // Redirect back to the page they came from
    router.push(redirectTo);
  } else {
    // ROLE BASED REDIRECT
    if (auth.role === "recruiter") {
      router.push("/recruiter/jobs");
    } else {
      router.push("/jobposts");
    }
  }
}

async function resendVerification() {
  try {
    await api.post("/auth/verify-email/resend", form);
    push.success(t("notifications.verificationEmailSent"));
    loading.value = true;
  } catch (e) {
    if (e?.response?.status === 429) {
      push.warning(e.response.data.message);
    } else {
      push.error(t("notifications.failedToSendVerificationEmail"));
    }
  } finally{
    loading.value = false;
  }
}

function loginWithGoogle() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_FILE_STORAGE_URL}/api/v1`;
  const url = `${apiBaseUrl}/users/google?role_id=1`;

  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const popup = window.open(
    url,
    "Google Login",
    `width=${width},height=${height},top=${top},left=${left}`
  );

  if (!popup) {
    push.error("Popup blocker is enabled. Please allow popups for this site.");
    return;
  }

  const checkInterval = setInterval(async () => {
    try {
      // Same-origin check (if configured/proxied)
      if (popup.location.href.includes("/users/google/callback")) {
        const text = popup.document.body.innerText;
        if (text) {
          const response = JSON.parse(text);
          if (response.success && response.data) {
            clearInterval(checkInterval);
            const { token, refreshToken } = response.data;
            
            auth.token = token;
            auth.refreshToken = refreshToken;
            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", refreshToken);

            try {
              const profileRes = await api.get("/users/workers/me");
              const workerData = profileRes.data.data;
              const userObj = {
                id: workerData.id,
                user_id: workerData.user_id,
                name: workerData.name,
                email: workerData.email,
                avatar_url: workerData.avatar_url,
                role: "user"
              };
              auth.user = userObj;
              localStorage.setItem("user", JSON.stringify(userObj));
            } catch (e) {
              console.error("Failed to fetch worker profile", e);
            }

            popup.close();
            push.success("Login successful!");
            router.push("/profile/edit");
            return;
          }
        }
      }
    } catch (e) {
      // Expected cross-origin access errors
    }

    if (popup.closed) {
      clearInterval(checkInterval);
      
      try {
        const res = await api.get("/users/workers/me");
        if (res.data && res.data.data) {
          const workerData = res.data.data;
          const dummyToken = "google-cookie-session";
          
          auth.token = dummyToken;
          localStorage.setItem("token", dummyToken);
          
          const userObj = {
            id: workerData.id,
            user_id: workerData.user_id,
            name: workerData.name,
            email: workerData.email,
            avatar_url: workerData.avatar_url,
            role: "user"
          };
          auth.user = userObj;
          localStorage.setItem("user", JSON.stringify(userObj));
          
          push.success("Login successful!");
          router.push("/profile/edit");
        } else {
          push.error("Google Login verification failed.");
        }
      } catch (err) {
        console.error("Verification after popup close failed:", err);
        push.error("Google Login verification failed.");
      }
    }
  }, 500);
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="w-full max-w-md">
      <!-- Card Container -->
      <div class="bg-white shadow-2xl rounded-3xl p-8 md:p-10">
        <!-- Logo/Branding -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ t("login") }}</h1>
          <p class="text-gray-600">{{ t("auth.jobSeekerSubtitle") }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="submit" class="space-y-5">
          <!-- Email Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("auth.emailLabel") }}</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition bg-gray-50"
              placeholder="you@example.com"
              required
            />
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("auth.passwordLabel") }}</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full border-2 border-gray-200 px-4 py-3 pr-12 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition bg-gray-50"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabindex="-1"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Forgot Password Link -->
          <div class="flex justify-end">
            <button
              type="button"
              @click="router.push('/forgot-password')"
              class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {{ t("auth.forgotPassword") }}
            </button>
          </div>

          <!-- Error Messages -->
          <div v-if="auth.error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p class="text-red-700 text-sm">{{ auth.error }}</p>
          </div>

          <div v-if="auth.needVerifyEmail" class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            <p class="text-yellow-700 text-sm">
              {{ t("auth.messages.emailNotVerified") }}
              <button
                type="button"
                @click="resendVerification"
                :disabled="loading"
                class="underline font-semibold hover:text-yellow-800 disabled:opacity-50"
              >
                {{ t("auth.buttons.resendVerification") }}
              </button>
            </p>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="auth.loading"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {{ auth.loading ? t("auth.buttons.signingIn") : t("auth.buttons.signIn") }}
          </button>

          <!-- Divider -->
          <div class="flex items-center my-6">
            <div class="grow border-t border-gray-300"></div>
            <span class="px-3 text-gray-500 text-sm">OR</span>
            <div class="grow border-t border-gray-300"></div>
          </div>

          <!-- Google Sign In Button -->
          <button
            type="button"
            @click="loginWithGoogle"
            class="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition shadow-sm hover:shadow-md cursor-pointer mb-2"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{{ t("auth.signInWithGoogle") }}</span>
          </button>

          <!-- Sign Up & Recruiter Links -->
          <div class="space-y-3">
            <p class="text-center text-sm text-gray-600">
              {{ t("auth.dontHaveAccount") }}
              <button
                type="button"
                @click="router.push('/register')"
                class="text-blue-600 font-semibold hover:text-blue-700"
              >
                {{ t("auth.createAccount") }}
              </button>
            </p>
            <p class="text-center text-sm text-gray-600">
              {{ t("auth.areYouRecruiter") }}
              <button
                type="button"
                @click="router.push('/recruiter-login')"
                class="text-indigo-600 font-semibold hover:text-indigo-700"
              >
                {{ t("auth.signInHere") }}
              </button>
            </p>
          </div>
        </form>
      </div>

      <!-- Footer Text -->
      <p class="text-center text-xs text-gray-500 mt-6">
        {{ t("auth.termsAndPrivacy") }}
        <router-link to="/terms-of-service" class="text-blue-600 hover:underline">{{ t("footer.termsOfService") }}</router-link>
        and
        <router-link to="/privacy-policy" class="text-blue-600 hover:underline">{{ t("footer.privacyPolicy") }}</router-link>
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
