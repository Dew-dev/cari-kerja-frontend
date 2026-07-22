<script setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { registerRecruiter } from "@/services/auth.api"
import TurnstileWidget from "@/components/common/TurnstileWidget.vue"
import { isCaptchaError, isDisposableEmailRejected, isRateLimitedError } from "@/utils/apiErrors"
import { useI18n } from "vue-i18n"

const { t } = useI18n()

const router = useRouter()

const form = reactive({
  username: "",
  email: "",
  password: "",
  company_name: "",
  contact_name: "",
  contact_phone: "",
})

const errors = reactive({
  username: "",
  email: "",
  password: "",
  company_name: "",
  contact_name: "",
  contact_phone: "",
})

const showPassword = ref(false)

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
  Object.keys(errors).forEach((k) => (errors[k] = ""))

  if (!/^[a-zA-Z0-9_]{4,}$/.test(form.username)) {
    errors.username = "Username must be at least 4 characters"
    valid = false
  }

  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "Invalid email address"
    valid = false
  }

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(
      form.password
    )
  ) {
    errors.password =
      "Password must be 8+ chars, include uppercase, lowercase, number & symbol"
    valid = false
  }

  if (form.company_name.length < 2) {
    errors.company_name = "Company name is required"
    valid = false
  }

  if (form.contact_name.length < 2) {
    errors.contact_name = "Contact name is required"
    valid = false
  }

  if (!/^[0-9]{10,}$/.test(form.contact_phone)) {
    errors.contact_phone = "Phone number must be at least 10 digits"
    valid = false
  }

  return valid
}

async function submit() {
  state.serverError = null
  if (!validate()) return

  state.loading = true
  try {
    await registerRecruiter({
      ...form,
      captcha_token: captchaToken.value || null,
    })
    router.push("/login")
  } catch (err) {
    if (isRateLimitedError(err)) {
      state.serverError = t("captcha.rateLimited")
      return
    }
    if (isCaptchaError(err)) {
      turnstileRef.value?.reset()
      state.serverError = t("captcha.required")
      return
    }
    if (isDisposableEmailRejected(err)) {
      state.serverError = t("contentRejected.disposableEmail")
      return
    }
    state.serverError =
      err.response?.data?.message || "Registration failed"
  } finally {
    state.loading = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
    <div class="w-full max-w-md">
      <!-- Card Container -->
      <div class="bg-white shadow-2xl rounded-3xl p-8 md:p-10">
        <!-- Logo/Branding -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-linear-to-br from-purple-600 to-pink-600 rounded-full mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5.5m0 0H9m0 0h5.5M9 7h1m-1 4h1m0 0h1m-1 4h1" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ t("register.titleRecruiter") }}</h1>
          <p class="text-gray-600">{{ t("auth.startPosting") }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="submit" class="space-y-5">
          <!-- Username Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("register.username") }}</label>
            <input
              v-model="form.username"
              type="text"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition bg-gray-50"
              placeholder="company123"
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
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition bg-gray-50"
              placeholder="recruiter@company.com"
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
            <p v-if="errors.password" class="text-red-600 text-xs mt-2">{{ errors.password }}</p>
          </div>

          <!-- Company Name Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("register.companyName") }}</label>
            <input
              v-model="form.company_name"
              type="text"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition bg-gray-50"
              placeholder="Your Company Ltd."
              required
            />
            <p v-if="errors.company_name" class="text-red-600 text-xs mt-2">{{ errors.company_name }}</p>
          </div>

          <!-- Contact Person Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("register.contactPerson") }}</label>
            <input
              v-model="form.contact_name"
              type="text"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition bg-gray-50"
              placeholder="John Manager"
              required
            />
            <p v-if="errors.contact_name" class="text-red-600 text-xs mt-2">{{ errors.contact_name }}</p>
          </div>

          <!-- Contact Phone Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t("register.contactNumber") }}</label>
            <input
              v-model="form.contact_phone"
              type="text"
              class="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition bg-gray-50"
              placeholder="+998 (XX) XXX-XX-XX"
              required
            />
            <p v-if="errors.contact_phone" class="text-red-600 text-xs mt-2">{{ errors.contact_phone }}</p>
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
            class="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
              @click="router.push('/recruiter-login')"
              class="text-purple-600 font-semibold hover:text-purple-700"
            >
              {{ t("auth.signInHere") }}
            </button>
          </p>
        </form>
      </div>

      <!-- Footer Text -->
      <p class="text-center text-xs text-gray-500 mt-6">
        {{ t("auth.termsAndPrivacyRegister") }}
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
