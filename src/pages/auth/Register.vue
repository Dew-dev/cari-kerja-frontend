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
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg">

      <h1 class="text-xl font-semibold mb-4">
        {{ t("register.title") }}
      </h1>

      <form @submit.prevent="submit" class="space-y-4">

        <!-- NAME -->
        <div>
          <label class="block text-sm mb-1">{{ t("register.fullName") }}</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            required
          />
          <p v-if="errors.name" class="text-red-600 text-xs mt-1">
            {{ errors.name }}
          </p>
        </div>

        <!-- USERNAME -->
        <div>
          <label class="block text-sm mb-1">{{ t("register.username") }}</label>
          <input
            v-model="form.username"
            type="text"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            required
          />
          <p v-if="errors.username" class="text-red-600 text-xs mt-1">
            {{ errors.username }}
          </p>
        </div>

        <!-- EMAIL -->
        <div>
          <label class="block text-sm mb-1">{{ t("register.email") }}</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            required
          /><p v-if="errors.email" class="text-red-600 text-xs mt-1">
            {{ errors.email }}
          </p>
        </div>

        <!-- PASSWORD -->
        <div>
          <label class="block text-sm mb-1">{{ t("register.password") }}</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            required
          />
          <p class="text-xs text-gray-500 mt-1">
            Min 8 chars, uppercase, lowercase, number & symbol
          </p>
          <p v-if="errors.password" class="text-red-600 text-xs mt-1">
            {{ errors.password }}
          </p>
        </div>

        <!-- ERROR -->
        <p v-if="state.error" class="text-red-600 text-sm">
          {{ state.error }}
        </p>

        <!-- SUBMIT -->
        <button
          type="submit"
          :disabled="state.loading"
          class="w-full bg-blue-600 text-white py-2 rounded-t-full rounded-b-full hover:bg-blue-700 disabled:opacity-50 rounded"
        >
          {{ state.loading ? t("register.loading") : t("register.signUp") }}
        </button>

        <!-- FOOTER -->
        <p class="text-sm text-center">
          {{ t("register.haveAccount") }}
          <span
            class="text-blue-600 cursor-pointer"
            @click="router.push('/login')"
          >
            {{ t("register.signIn") }}
          </span>
        </p>

      </form>
    </div>
  </div>
</template>
