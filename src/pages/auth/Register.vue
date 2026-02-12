<script setup>
import { reactive } from "vue"
import { useRouter } from "vue-router"
import { register } from "@/services/auth.api"

import { useI18n } from "vue-i18n"
import { push } from "notivue"

const { locale, t } = useI18n()
const router = useRouter()

const form = reactive({
  name: "",
  username: "",
  email: "",
  password: "",
})

const errors = reactive({
  name: "",
  username: "",
  email: "",
  password: "",
})

const state = reactive({
  loading: false,
  serverError: null,
})

function validate() {
  let valid = true

  // reset errors
  Object.keys(errors).forEach((k) => (errors[k] = ""))

  // NAME
  if (form.name.length < 3) {
    errors.name = "Name must be at least 3 characters"
    valid = false
  }

  // USERNAME
  if (!/^[a-zA-Z0-9_]{5,}$/.test(form.username)) {
    errors.username =
      "Username must be at least 5 characters and alphanumeric"
    valid = false
  }

  // EMAIL
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "Invalid email address"
    valid = false
  }

  // PASSWORD
  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(
      form.password
    )
  ) {
    errors.password =
      "Password must be 8+ chars, include uppercase, lowercase, number & symbol"
    valid = false
  }

  return valid
}
async function submit() {
//   state.loading = true
  state.serverError  = null

  if (!validate()) return

  state.loading = true
  try {
    const response = await register(form)
    if (response && response.data && response.data.message) {
      push.success(response.data.message)
      router.push("/login")
    }
    // setelah register → login
  } catch (err) {
    state.error =
      err.response?.data?.message || "Registration failed"
    push.error(state.error)
  } finally {
    state.loading = false
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
          <div class="inline-flex items-center justify-center w-14 h-14 bg-linear-to-br from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ t("register.title") }}</h1>
          <p class="text-gray-600">{{ t("auth.joinCommunity") }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="submit" class="space-y-5">
          <!-- Name Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("register.fullName") }}</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition bg-gray-50"
              placeholder="John Doe"
              required
            />
            <p v-if="errors.name" class="text-red-600 text-xs mt-2">{{ errors.name }}</p>
          </div>

          <!-- Username Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("register.username") }}</label>
            <input
              v-model="form.username"
              type="text"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition bg-gray-50"
              placeholder="johndoe123"
              required
            />
            <p v-if="errors.username" class="text-red-600 text-xs mt-2">{{ errors.username }}</p>
          </div>

          <!-- Email Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("register.email") }}</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition bg-gray-50"
              placeholder="john@example.com"
              required
            />
            <p v-if="errors.email" class="text-red-600 text-xs mt-2">{{ errors.email }}</p>
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("register.password") }}</label>
            <input
              v-model="form.password"
              type="password"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition bg-gray-50"
              placeholder="••••••••"
              required
            />
            <p class="text-xs text-gray-500 mt-2">{{ t("auth.passwordRequirements") }}</p>
            <p v-if="errors.password" class="text-red-600 text-xs mt-2">{{ errors.password }}</p>
          </div>

          <!-- Error Message -->
          <div v-if="state.serverError" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p class="text-red-700 text-sm">{{ state.serverError }}</p>
          </div>

          <!-- Sign Up Button -->
          <button
            type="submit"
            :disabled="state.loading"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {{ state.loading ? t("register.loading") : t("register.signUp") }}
          </button>

          <!-- Divider -->
          <div class="flex items-center my-4">
            <div class="grow border-t border-gray-300"></div>
            <span class="px-3 text-gray-500 text-sm">OR</span>
            <div class="grow border-t border-gray-300"></div>
          </div>

          <!-- Sign In Link -->
          <p class="text-center text-sm text-gray-600">
            {{ t("auth.alreadyHaveAccount") }}
            <button
              type="button"
              @click="router.push('/login')"
              class="text-blue-600 font-semibold hover:text-blue-700"
            >
              {{ t("auth.signInHere") }}
            </button>
          </p>
        </form>
      </div>

      <!-- Footer Text -->
      <p class="text-center text-xs text-gray-500 mt-6">
        {{ t("auth.termsAndPrivacyRegister") }}
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

<style scoped>
header {
  display: none;
}
footer {
  display: none;
}
</style>
