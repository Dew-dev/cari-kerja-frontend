<script setup>
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";
defineProps({
  name: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
})

const router = useRouter()

function goProfile() {
  if (auth.role === "recruiter") {
    router.push("/recruiter/profile/edit")
  } else {
    router.push("/profile/edit")
  }
}
</script>

<template>
  <div
    class="flex items-center gap-2 cursor-pointer"
    @click="goProfile"
  >
    <!-- AVATAR -->
    <div
      class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden"
    >
      <img
        v-if="avatar"
        :src="linkStorageUrl + avatar"
        class="w-full h-full object-cover"
      />
      <span
        v-else
        class="text-sm font-semibold text-gray-700"
      >
        {{ name?.charAt(0)?.toUpperCase() }}
      </span>
    </div>

    <!-- NAME (optional hide on mobile later) -->
    <span class="text-sm">
      {{ name }}
    </span>
  </div>
</template>
