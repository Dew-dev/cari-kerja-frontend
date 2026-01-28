<script setup>
import { ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import api from "@/services/api"

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
    error.value = "Password is required"
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Password confirmation does not match"
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
      err?.response?.data?.message || "Failed to reset password"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 rounded-md">
    <div class="w-full max-w-sm bg-white shadow-lg p-6 rounded-2xl">

      <h1 class="text-xl font-semibold mb-2">
        Reset Password
      </h1>

      <p class="text-sm text-gray-500 mb-4">
        Enter your new password below.
      </p>

      <!-- SUCCESS -->
      <div
        v-if="success"
        class="text-sm text-green-600 text-center"
      >
        Password reset successfully.<br />
        Redirecting to login…
      </div>

      <!-- FORM -->
      <form
        v-else
        @submit.prevent="submit"
        class="space-y-4"
      >
        <div>
          <label class="block text-sm mb-1">New Password</label>
          <input
            v-model="password"
            type="password"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Confirm Password</label>
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
          {{ loading ? "Saving..." : "Reset Password" }}
        </button>
      </form>

    </div>
  </div>
</template>
