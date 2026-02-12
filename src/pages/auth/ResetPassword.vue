<script setup>
import { ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import api from "@/services/api"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const token = route.query.token

const password = ref("")
const confirmPassword = ref("")
const loading = ref(false)
const error = ref("")
const success = ref(false)

async function submit() {
  if (!password.value || !confirmPassword.value) {
    error.value = t("auth.messages.noPassword")
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = t("auth.messages.passwordMismatch")
    return
  }

  try {
    loading.value = true
    error.value = ""

    await api.post("/auth/reset-password", {
      token,
      password: password.value,
    })

    success.value = true

    setTimeout(() => {
      router.push("/login")
    }, 2000)
  } catch (err) {
    error.value =
      err?.response?.data?.message || t("auth.messages.failedReset")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 rounded-md">
    <div class="w-full max-w-sm bg-white shadow-lg p-6 rounded-2xl">

      <h1 class="text-xl font-semibold mb-2">
        {{ t("auth.buttons.resetPassword") }}
      </h1>

      <p class="text-sm text-gray-500 mb-4">
        {{ t("auth.enterNewPassword") }}
      </p>

      <!-- SUCCESS -->
      <div
        v-if="success"
        class="text-sm text-green-600 text-center"
      >
        {{ t("auth.messages.passwordResetSuccess") }}<br />
        {{ t("auth.buttons.redirecting") }}
      </div>

      <!-- FORM -->
      <form
        v-else
        @submit.prevent="submit"
        class="space-y-4"
      >
        <div>
          <label class="block text-sm mb-1">{{ t("auth.newPassword") }}</label>
          <input
            v-model="password"
            type="password"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-1">{{ t("auth.confirmPasswordLabel") }}</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="error" class="text-red-600 text-sm">
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full border bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? t("auth.buttons.savingPassword") : t("auth.buttons.resetPassword") }}
        </button>
      </form>

    </div>
  </div>
</template>
