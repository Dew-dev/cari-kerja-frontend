<script setup>
import { reactive } from "vue"
import { useRouter } from "vue-router"
import { register } from "@/services/auth.api"

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

const state = reactive({
  loading: false,
  serverError: null,
})

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
    await register(form)
    router.push("/login")
  } catch (err) {
    state.serverError =
      err.response?.data?.message || "Registration failed"
  } finally {
    state.loading = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white my-10 p-6  gap-4 rounded-lg shadow-lg ">

      <h1 class="text-xl font-semibold mb-4 col-span-4">
        {{ t("register.titleRecruiter") }}
      </h1>

      <form @submit.prevent="submit" class="space-y-4 grid grid-cols-4  gap-4">

        <div class="col-span-4">
          <label class="block text-sm mb-1">{{ t("register.username") }}</label>
          <input v-model="form.username" class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md" />
          <p v-if="errors.username" class="text-red-600 text-xs">
            {{ errors.username }}
          </p>
        </div>

        <div class="col-span-4">
          <label class="block text-sm mb-1">{{ t("register.email") }}</label>
          <input v-model="form.email" class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md" />
          <p v-if="errors.email" class="text-red-600 text-xs">
            {{ errors.email }}
          </p>
        </div>

        <div class="col-span-4">
          <label class="block text-sm mb-1">{{ t("register.password") }}</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
          />
          <p v-if="errors.password" class="text-red-600 text-xs">
            {{ errors.password }}
          </p>
        </div>

        <div class="col-span-4">
          <label class="block text-sm mb-1">{{ t("register.companyName") }}</label>
          <input
            v-model="form.company_name"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
          />
          <p v-if="errors.company_name" class="text-red-600 text-xs">
            {{ errors.company_name }}
          </p>
        </div>

        <div class="col-span-2">
          <label class="block text-sm mb-1">{{ t("register.contactPerson") }}</label>
          <input
            v-model="form.contact_name"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
          />
          <p v-if="errors.contact_name" class="text-red-600 text-xs">
            {{ errors.contact_name }}
          </p>
        </div>

        <div class="col-span-2">
          <label class="block text-sm mb-1">{{ t("register.contactNumber") }}</label>
          <input
            v-model="form.contact_phone"
            class="w-full bg-gray-100 shadow-sm px-3 py-2 rounded-md"
          />
          <p v-if="errors.contact_phone" class="text-red-600 text-xs">
            {{ errors.contact_phone }}
          </p>
        </div>

        <p v-if="state.serverError" class="text-red-600 text-sm">
          {{ state.serverError }}
        </p>

        <button
          type="submit"
          :disabled="state.loading"
          class="w-full bg-blue-600 text-white py-2 col-span-4 rounded-t-full rounded-b-full hover:bg-blue-700 disabled:opacity-50"
        >
          {{ state.loading ? t("register.loading") : t("register.signUp") }}
        </button>

        <p class="text-sm text-center col-span-4">
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
