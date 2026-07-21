<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
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
  /** Peer sudah diblokir oleh user saat ini */
  isBlocked: {
    type: Boolean,
    default: false,
  },
  actionLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['back', 'report', 'block', 'unblock'])

const menuOpen = ref(false)

function goToProfile() {
  if (!props.profileId || !props.profileRole) return
  if (props.profileRole === 'worker') {
    router.push(`/workers/${props.profileId}`)
  } else if (props.profileRole === 'recruiter') {
    router.push(`/recruiters/${props.profileId}`)
  }
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function onReport() {
  closeMenu()
  emit('report')
}

function onBlock() {
  closeMenu()
  emit('block')
}

function onUnblock() {
  closeMenu()
  emit('unblock')
}

function onDocClick(e) {
  if (!e.target.closest?.('[data-chat-header-menu]')) {
    closeMenu()
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
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
      <p class="text-xs" :class="isBlocked ? 'text-red-500' : online ? 'text-green-500' : 'text-gray-400'">
        {{
          isBlocked
            ? $t('chat.blockedStatus')
            : online
              ? $t('chat.online')
              : $t('chat.offline')
        }}
      </p>
    </div>

    <!-- Actions menu -->
    <div class="relative shrink-0" data-chat-header-menu>
      <button
        type="button"
        class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
        :disabled="actionLoading"
        :aria-label="$t('chat.moreActions')"
        @click.stop="toggleMenu"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      <div
        v-if="menuOpen"
        class="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30"
      >
        <button
          type="button"
          class="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          @click="onReport"
        >
          <i class="pi pi-flag text-xs text-amber-500"></i>
          {{ $t('chat.report.action') }}
        </button>
        <button
          v-if="!isBlocked"
          type="button"
          class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          @click="onBlock"
        >
          <i class="pi pi-ban text-xs"></i>
          {{ $t('chat.block.action') }}
        </button>
        <button
          v-else
          type="button"
          class="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
          @click="onUnblock"
        >
          <i class="pi pi-unlock text-xs"></i>
          {{ $t('chat.block.unblock') }}
        </button>
      </div>
    </div>
  </div>
</template>
