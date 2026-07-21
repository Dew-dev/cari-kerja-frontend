<script setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { register } from "@/services/auth.api"
import api from "@/services/api"
import { useAuthStore } from "@/stores/authStore"
import TurnstileWidget from "@/components/common/TurnstileWidget.vue"
import { isCaptchaError, isDisposableEmailRejected, isRateLimitedError } from "@/utils/apiErrors"

import { useI18n } from "vue-i18n"
import { push } from "notivue"

const { locale, t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const showPassword = ref(false)

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

const captchaToken = ref("")
const turnstileRef = ref(null)

function onCaptchaVerified(token) {
  captchaToken.value = token
}

function onCaptchaExpired() {
  captchaToken.value = ""
}

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
    const response = await register({
      ...form,
      captcha_token: captchaToken.value || null,
    })
    if (response && response.data && response.data.message) {
      push.success(response.data.message)
      router.push("/login")
    }
    // setelah register → login
  } catch (err) {
    if (isRateLimitedError(err)) {
      state.serverError = t("captcha.rateLimited")
      push.warning(state.serverError)
      return
    }
    if (isCaptchaError(err)) {
      turnstileRef.value?.reset()
      state.serverError = t("captcha.required")
      push.warning(state.serverError)
      return
    }
    if (isDisposableEmailRejected(err)) {
      state.serverError = t("contentRejected.disposableEmail")
      push.warning(state.serverError)
      return
    }
    state.serverError =
      err.response?.data?.message || "Registration failed"
    push.error(state.serverError)
  } finally {
    state.loading = false
  }
}

function loginWithGoogle() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_FILE_STORAGE_URL}/api/v1`;
  window.location.href = `${apiBaseUrl}/users/google?role_id=1&origin=${encodeURIComponent(window.location.origin)}`;
}

function loginWithTelegram() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_FILE_STORAGE_URL}/api/v1`;
  window.location.href = `${apiBaseUrl}/users/telegram?role_id=1&origin=${encodeURIComponent(window.location.origin)}`;
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
            <p class="text-xs text-gray-500 mt-2">{{ t("auth.passwordRequirements") }}</p>
            <p v-if="errors.password" class="text-red-600 text-xs mt-2">{{ errors.password }}</p>
          </div>

          <!-- Error Message -->
          <div v-if="state.serverError" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p class="text-red-700 text-sm">{{ state.serverError }}</p>
          </div>

          <!-- CAPTCHA -->
          <TurnstileWidget
            ref="turnstileRef"
            @verified="onCaptchaVerified"
            @expired="onCaptchaExpired"
          />

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

          <!-- OAuth Buttons (Google & Telegram) -->
          <div class="grid grid-cols-2 gap-3 mb-2">
            <!-- Google Sign Up Button -->
            <button
              type="button"
              @click="loginWithGoogle"
              class="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition shadow-sm hover:shadow-md cursor-pointer"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span class="text-sm truncate">Google</span>
            </button>

            <!-- Telegram Sign Up Button -->
            <button
              type="button"
              @click="loginWithTelegram"
              class="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition shadow-sm hover:shadow-md cursor-pointer"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.578.192l-8.533 7.701-.332 4.966c.487 0 .702-.223.974-.486l2.338-2.274 4.864 3.593c.897.495 1.543.239 1.767-.833l3.19-15.028c.327-1.31-.502-1.906-1.361-1.503z" fill="#229ED9"/>
              </svg>
              <span class="text-sm truncate">Telegram</span>
            </button>
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
