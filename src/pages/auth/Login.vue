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
  if (success) {
    // sementara redirect ke home
    router.push("/")
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm bg-white border p-6">

      <h1 class="text-xl font-semibold mb-4">
        Login
      </h1>

      <form @submit.prevent="submit" class="space-y-4">

        <div>
          <label class="block text-sm mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full border px-3 py-2"
            placeholder="email@example.com"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full border px-3 py-2"
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
          class="w-full border bg-blue-600 text-white py-2"
        >
          {{ auth.loading ? "Signing in..." : "Sign in" }}
        </button>

      </form>
    </div>
  </div>
</template>
