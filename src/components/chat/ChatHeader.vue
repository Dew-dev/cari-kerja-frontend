<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || ''

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  profileId: {
    type: String,
    default: null,
  },
  profileRole: {
    type: String,
    default: null, // 'worker' | 'recruiter'
  },
  online: {
    type: Boolean,
    default: false,
  },
  showBack: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['back'])

function goToProfile() {
  if (!props.profileId || !props.profileRole) return
  if (props.profileRole === 'worker') {
    router.push(`/workers/${props.profileId}`)
  } else if (props.profileRole === 'recruiter') {
    router.push(`/recruiters/${props.profileId}`)
  }
}
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 shrink-0">
    <!-- Back button (mobile) -->
    <button
      v-if="showBack"
      @click="emit('back')"
      class="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Avatar + Online indicator -->
    <div
      class="relative shrink-0 cursor-pointer"
      @click="goToProfile"
    >
      <div class="w-9 h-9 rounded-full overflow-hidden bg-blue-100">
        <img
          v-if="avatarUrl"
          :src="`${fileStorageUrl}${avatarUrl}`"
          :alt="name"
          class="w-full h-full object-cover"
        />
        <span
          v-else
          class="w-full h-full flex items-center justify-center text-sm font-bold text-blue-600"
        >
          {{ name?.charAt(0)?.toUpperCase() || '?' }}
        </span>
      </div>
      <span
        v-if="online"
        class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"
      />
    </div>

    <!-- Name + Status -->
    <div class="flex-1 min-w-0 cursor-pointer" @click="goToProfile">
      <p class="text-sm font-semibold text-gray-800 truncate">{{ name }}</p>
      <p class="text-xs" :class="online ? 'text-green-500' : 'text-gray-400'">
        {{ online ? $t('chat.online') : $t('chat.offline') }}
      </p>
    </div>
  </div>
</template>
