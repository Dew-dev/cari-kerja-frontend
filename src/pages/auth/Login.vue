<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authstore";

import { useI18n } from "vue-i18n";
import api from "../../services/api";
const { locale, t } = useI18n();

const router = useRouter();
const auth = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});

async function submit() {
  const success = await auth.login(form);
  if (!success) return;

  // ROLE BASED REDIRECT
  if (auth.role === "recruiter") {
    router.push("/recruiter");
  } else {
    router.push("/jobposts");
  }
}

async function resendVerification() {
  try {
    await api.post("/auth/verify-email/resend",form)
    alert("Verification email sent")
  } catch {
    alert("Failed to send verification email")
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 rounded-md"
  >
    <div class="w-full max-w-sm bg-white shadow-lg p-6 rounded-2xl">
      <h1 class="text-xl font-semibold mb-4">
        {{ t("login") }}
      </h1>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm mb-1">Email</label>
          <input
            v-model="form.email"
            type="text"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            placeholder="Username or Email"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="auth.error" class="text-red-600 text-sm">
          {{ auth.error }}
        </p>
        <p v-if="auth.needVerifyEmail" class="text-sm text-yellow-600">
          Your email is not verified.
          <span class="underline cursor-pointer" @click="resendVerification">
            Resend verification email
          </span>
        </p>
        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full border bg-blue-600 text-white py-2 rounded-t-full rounded-b-full hover:bg-blue-700 disabled:opacity-50"
        >
          {{ auth.loading ? "Signing in..." : t("nav.signIn") }}
        </button>

        <p class="text-sm text-center">
          {{ t("register.noAccount") }}
          <span
            class="text-blue-600 cursor-pointer"
            @click="router.push('/register')"
          >
            {{ t("register.signUp") }}
          </span>
        </p>
        <p class="text-center text-sm">OR</p>
        <p class="text-center text-sm">
          {{ t("forgotyourPassword") }}

          <span
            class="text-blue-600 cursor-pointer"
            @click="router.push('/forgot-password')"
          >
            {{ t("clickHere") }}
          </span>
        </p>
      </form>
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
