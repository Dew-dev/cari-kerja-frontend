<script setup>
import { reactive } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../../stores/authstore"

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  email: "",
  password: "",
})

async function submit() {
  const success = await auth.login(form)
   if (!success) return

  // ROLE BASED REDIRECT
  if (auth.role === "recruiter") {
    router.push("/recruiter")
  } else {
    router.push("/jobs")
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 rounded">
    <div class="w-full max-w-sm bg-white border p-6 rounded-2xl">

      <h1 class="text-xl font-semibold mb-4">
        Login
      </h1>

      <form @submit.prevent="submit" class="space-y-4">

        <div>
          <label class="block text-sm mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full border px-3 py-2 rounded-sm"
            placeholder="email@example.com"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full border px-3 py-2 rounded-sm"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="auth.error" class="text-red-600 text-sm">
          {{ auth.error }}
        </p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full border bg-blue-600 text-white py-2 rounded-t-full rounded-b-full hover:bg-blue-700 disabled:opacity-50"
        >
          {{ auth.loading ? "Signing in..." : "Sign in" }}
        </button>

      </form>
    </div>
  </div>
</template>
