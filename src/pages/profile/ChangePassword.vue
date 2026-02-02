<script setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import api from "../../services/api"
import { useAuthStore } from "../../stores/authstore"

const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const error = ref("")
const success = ref(false)

const form = reactive({
  current_password: "",
  new_password: "",
  confirm_password: "",
})

async function submit() {
  if (form.new_password !== form.confirm_password) {
    error.value = "Password confirmation does not match"
    return
  }

  try {
    loading.value = true
    error.value = ""

    await api.post("/auth/change-password", {
      current_password: form.current_password,
      new_password: form.new_password,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    success.value = true

    // logout paksa
    setTimeout(() => {
      auth.logout()
      router.push("/login")
    }, 1500)
  } catch (e) {
    error.value =
      e?.response?.data?.message || "Failed to change password"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md bg-white rounded-2xl p-6 shadow mx-auto my-20">
    <h2 class="text-lg font-semibold mb-4">
      Change Password
    </h2>

    <form @submit.prevent="submit" class="space-y-4">

      <input
        v-model="form.current_password"
        type="password"
        placeholder="Current password"
        class="w-full bg-gray-100 px-3 py-2 rounded"
        required
      />

      <input
        v-model="form.new_password"
        type="password"
        placeholder="New password"
        class="w-full bg-gray-100 px-3 py-2 rounded"
        required
      />

      <input
        v-model="form.confirm_password"
        type="password"
        placeholder="Confirm new password"
        class="w-full bg-gray-100 px-3 py-2 rounded"
        required
      />

      <p v-if="error" class="text-sm text-red-600">
        {{ error }}
      </p>

      <p v-if="success" class="text-sm text-green-600">
        Password changed. Please login again.
      </p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 rounded-full disabled:opacity-50"
      >
        {{ loading ? "Saving..." : "Change Password" }}
      </button>
    </form>
  </div>
</template>
