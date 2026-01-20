<script setup>
import { reactive } from "vue"
import { useRouter } from "vue-router"
import { register } from "../../services/auth.api"

const router = useRouter()

const form = reactive({
  name: "",
  email: "",
  password: "",
  role: "user", // default job seeker
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

    // setelah register → login page
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
    <div class="w-full max-w-sm bg-white border p-6">

      <h1 class="text-xl font-semibold mb-4">
        Create account
      </h1>

      <form @submit.prevent="submit" class="space-y-4">

        <div>
          <label class="block text-sm mb-1">Full name</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full border px-3 py-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full border px-3 py-2"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full border px-3 py-2"
            required
          />
        </div>

        <!-- ROLE -->
        <div>
          <label class="block text-sm mb-1">I am a</label>
          <select
            v-model="form.role"
            class="w-full border px-3 py-2"
          >
            <option value="user">Job seeker</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>

        <p v-if="state.error" class="text-red-600 text-sm">
          {{ state.error }}
        </p>

        <button
          type="submit"
          :disabled="state.loading"
          class="w-full bg-blue-600 text-white py-2"
        >
          {{ state.loading ? "Creating..." : "Create account" }}
        </button>

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
