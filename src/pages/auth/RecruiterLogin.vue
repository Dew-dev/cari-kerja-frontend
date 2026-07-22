<script setup>
import { reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore.js";

import { push } from "notivue";
import { useI18n } from "vue-i18n";
import api from "@/services/api";
import TurnstileWidget from "@/components/common/TurnstileWidget.vue";
import { isRateLimitedError } from "@/utils/apiErrors";
import { resolveRecruiterLandingPath } from "@/utils/recruiterLanding";

const { t } = useI18n();
const loading = ref(false);
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const showPassword = ref(false);
const resendCooldown = ref(0);
let resendTimer = null;

const form = reactive({
  email: "",
  password: "",
});

const captchaToken = ref("");
const turnstileRef = ref(null);

function onCaptchaVerified(token) {
  captchaToken.value = token;
}

function onCaptchaExpired() {
  captchaToken.value = "";
}

function startResendCooldown(seconds = 120) {
  resendCooldown.value = seconds;
  if (resendTimer) clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    resendCooldown.value -= 1;
    if (resendCooldown.value <= 0) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }, 1000);
}

async function submit() {
  const payload = {
    email: form.email,
    password: form.password,
  };
  if (auth.captchaRequired && captchaToken.value) {
    payload.captcha_token = captchaToken.value;
  }

  const success = await auth.login(payload);
  if (!success) {
    if (auth.captchaRequired) {
      turnstileRef.value?.reset();
    }
    return;
  }

  // Check if there's a redirect query parameter
  const redirectTo = route.query.redirect;

  if (auth.role === "recruiter" && auth.restrictedVerification) {
    router.push("/recruiter/verification");
    return;
  }

  if (redirectTo && !auth.restrictedVerification) {
    router.push(redirectTo);
  } else if (auth.role === "recruiter") {
    router.push(await resolveRecruiterLandingPath());
  } else {
    router.push("/jobposts");
  }
}

async function resendVerification() {
  if (loading.value || resendCooldown.value > 0) return;
  loading.value = true;
  try {
    await api.post("/auth/verify-email/resend", { email: form.email });
    push.success(t("notifications.verificationEmailSent"));
    startResendCooldown(120);
  } catch (e) {
    if (isRateLimitedError(e) || e?.response?.status === 429) {
      push.warning(t("captcha.rateLimited"));
      startResendCooldown(120);
    } else {
      push.error(t("notifications.failedToSendVerificationEmail"));
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-pink-100 p-4">
    <div class="w-full max-w-md">
      <!-- Card Container -->
      <div class="bg-white shadow-2xl rounded-3xl p-8 md:p-10">
        <!-- Logo/Branding -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-linear-to-br from-purple-600 to-pink-600 rounded-full mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ t("login") }}</h1>
          <p class="text-gray-600">{{ t("auth.recruiterSubtitle") }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="submit" class="space-y-5">
          <!-- Email Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("auth.usernameLabel") }}</label>
            <input
              v-model="form.email"
              type="text"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition bg-gray-50"
              placeholder="you@company.com"
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
                class="w-full border-2 border-gray-200 px-4 py-3 pr-12 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition bg-gray-50"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                tabindex="-1"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.07-3.405M9.88 9.88a3 3 0 104.243 4.243M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Forgot Password Link -->
          <div class="flex justify-end">
            <button
              type="button"
              @click="router.push('/forgot-password')"
              class="text-sm text-purple-600 hover:text-purple-700 font-medium"
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
                :disabled="loading || resendCooldown > 0"
                class="underline font-semibold hover:text-yellow-800 disabled:opacity-50"
              >
                <span v-if="resendCooldown > 0">
                  {{ t("auth.resendIn") }} {{ resendCooldown }}s
                </span>
                <span v-else>{{ t("auth.buttons.resendVerification") }}</span>
              </button>
            </p>
          </div>

          <TurnstileWidget
            v-if="auth.captchaRequired"
            ref="turnstileRef"
            @verified="onCaptchaVerified"
            @expired="onCaptchaExpired"
          />

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="auth.loading"
            class="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {{ auth.loading ? t("auth.buttons.signingIn") : t("auth.signInAsRecruiter") }}
          </button>

          <!-- Divider -->
          <div class="flex items-center my-6">
            <div class="grow border-t border-gray-300"></div>
            <span class="px-3 text-gray-500 text-sm">OR</span>
            <div class="grow border-t border-gray-300"></div>
          </div>

          <!-- Sign Up & Job Seeker Links -->
          <div class="space-y-3">
            <p class="text-center text-sm text-gray-600">
              {{ t("auth.dontHaveRecruiterAccount") }}
              <button
                type="button"
                @click="router.push('/register-recruiter')"
                class="text-purple-600 font-semibold hover:text-purple-700"
              >
                {{ t("auth.registerHere") }}
              </button>
            </p>
            <p class="text-center text-sm text-gray-600">
              {{ t("auth.lookingForJob") }}
              <button
                type="button"
                @click="router.push('/login')"
                class="text-blue-600 font-semibold hover:text-blue-700"
              >
                {{ t("auth.jobSeekerLogin") }}
              </button>
            </p>
          </div>
        </form>
      </div>

      <!-- Footer Text -->
      <p class="text-center text-xs text-gray-500 mt-6">
        {{ t("auth.termsAndPrivacy") }}
        <router-link to="/terms-of-service" class="text-purple-600 hover:underline">{{ t("footer.termsOfService") }}</router-link>
        and
        <router-link to="/privacy-policy" class="text-purple-600 hover:underline">{{ t("footer.privacyPolicy") }}</router-link>
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
