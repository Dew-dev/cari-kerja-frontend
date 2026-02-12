<script setup>
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import api from "@/services/api"

const { t } = useI18n()
const email = ref("")
const loading = ref(false)
const sent = ref(false)
const error = ref("")
const cooldown = ref(0)
let timer = null

async function submit() {
  if (!email.value) return

  try {
    loading.value = true
    error.value = ""

    await api.post("/auth/forgot-password", {
      email: email.value,
    })

    sent.value = true
    startCooldown()
  } catch (e) {
    error.value = t("auth.messages.failedReset")
  } finally {
    loading.value = false
  }
}

function startCooldown() {
  cooldown.value = 120 // 2 menit
  clearInterval(timer)

  timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm bg-white shadow-lg p-6 rounded-2xl">

      <h1 class="text-xl font-semibold mb-2">
        {{ t("auth.forgotPassword") }}
      </h1>

      <p class="text-sm text-gray-500 mb-4">
        {{ t("auth.sendResetLinkSubtitle") }}
      </p>

      <form @submit.prevent="submit" class="space-y-4">

        <input
          v-model="email"
          type="email"
          class="w-full bg-gray-100 px-3 py-2 rounded-md"
          placeholder="Email address"
          required
        />

        <p v-if="error" class="text-sm text-red-600">
          {{ error }}
        </p>

        <p
          v-if="sent"
          class="text-sm text-green-600"
        >
          {{ t("auth.ifEmailExists") }}
        </p>

        <button
          type="submit"
          :disabled="loading || cooldown > 0"
          class="w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
        >
          <span v-if="cooldown > 0">
            {{ t("auth.resendIn") }} {{ cooldown }}s
          </span>
          <span v-else>
            {{ loading ? t("auth.buttons.sending") : t("auth.buttons.sendResetLink") }}
          </span>
        </button>

      </form>
    </div>
  </div>
</template>
