<script setup>
import { reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/authstore";

import { push } from "notivue";
import { useI18n } from "vue-i18n";
import api from "../../services/api";
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
            <input
              v-model="form.password"
              type="password"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition bg-gray-50"
              placeholder="••••••••"
              required
            />
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
