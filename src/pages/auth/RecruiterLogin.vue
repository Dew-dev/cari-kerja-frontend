<script setup>
import { reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authstore";

import { push } from "notivue";
import { useI18n } from "vue-i18n";
import api from "@/services/api";
const { locale, t } = useI18n();
const loading = ref(false);
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
    // ROLE BASED REDIRECT - for recruiter login, go to recruiter dashboard
    if (auth.role === "recruiter") {
      router.push("/recruiter/jobs");
    } else {
      // If user logged in as job seeker, redirect to job seeker area
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
            <input
              v-model="form.password"
              type="password"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition bg-gray-50"
              placeholder="••••••••"
              required
            />
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
