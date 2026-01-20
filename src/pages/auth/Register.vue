<script setup>
import { reactive } from "vue"
import { useRouter } from "vue-router"
import { register } from "@/services/auth.api"

const router = useRouter()

const form = reactive({
  name: "",
  username: "",
  email: "",
  password: "",
})

const state = reactive({
  loading: false,
  error: null,
})

async function submit() {
  state.loading = true
  state.error = null

  try {
    await register(form)

    // setelah register → login
    router.push("/login")
  } catch (err) {
    state.error =
      err.response?.data?.message || "Registration failed"
  } finally {
    state.loading = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg">

      <h1 class="text-xl font-semibold mb-4">
        Create account
      </h1>

      <form @submit.prevent="submit" class="space-y-4">

        <!-- NAME -->
        <div>
          <label class="block text-sm mb-1">Full name</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            required
          />
        </div>

        <!-- USERNAME -->
        <div>
          <label class="block text-sm mb-1">Username</label>
          <input
            v-model="form.username"
            type="text"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            required
          />
        </div>

        <!-- EMAIL -->
        <div>
          <label class="block text-sm mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            required
          />
        </div>

        <!-- PASSWORD -->
        <div>
          <label class="block text-sm mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
            required
          />
          <p class="text-xs text-gray-500 mt-1">
            Min 8 chars, uppercase, lowercase, number & symbol
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
          {{ state.loading ? "Creating..." : "Create account" }}
        </button>

        <!-- FOOTER -->
        <p class="text-sm text-center">
          Already have an account?
          <span
            class="text-blue-600 cursor-pointer"
            @click="router.push('/login')"
          >
            Sign in
          </span>
        </p>

      </form>
    </div>
  </div>
</template>
