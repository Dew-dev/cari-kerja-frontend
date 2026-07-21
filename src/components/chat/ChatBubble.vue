<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { isOwnMessage } from '@/utils/chatIdentity'

const auth = useAuthStore()
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || ''

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  showAvatar: {
    type: Boolean,
    default: true,
  },
  participantName: {
    type: String,
    default: '',
  },
  participantAvatar: {
    type: String,
    default: null,
  },
  /** Izinkan report pesan lawan bicara */
  allowReport: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['report'])

const isMine = computed(() => isOwnMessage(props.message, auth.user))
const menuOpen = ref(false)

const displayName = computed(
  () => props.message.sender?.name || props.participantName || '',
)

const avatarSrc = computed(() => {
  const url = props.message.sender?.avatar_url || props.participantAvatar
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${fileStorageUrl}${url}`
})

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function onReport() {
  menuOpen.value = false
  if (!props.message?.id || String(props.message.id).startsWith('temp_')) return
  emit('report', props.message.id)
}

function onDocClick(e) {
  if (!e.target.closest?.('[data-chat-bubble-menu]')) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div
    class="flex gap-2 mb-1.5 w-full group"
    :class="isMine ? 'justify-end' : 'justify-start'"
  >
    <!-- Avatar (theirs) -->
    <div v-if="!isMine && showAvatar" class="shrink-0 self-end">
      <div class="w-7 h-7 rounded-full overflow-hidden bg-blue-100 ring-1 ring-black/5">
        <img
          v-if="avatarSrc"
          :src="avatarSrc"
          :alt="displayName"
          class="w-full h-full object-cover"
        />
        <span
          v-else
          class="w-full h-full flex items-center justify-center text-xs font-bold text-blue-600"
        >
          {{ displayName?.charAt(0)?.toUpperCase() || '?' }}
        </span>
      </div>
    </div>
    <div v-else-if="!isMine && !showAvatar" class="w-7 shrink-0" />

    <!-- Bubble -->
    <div class="flex flex-col max-w-[78%] sm:max-w-[70%] relative" :class="isMine ? 'items-end' : 'items-start'">
      <div
        class="px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-sm"
        :class="[
          isMine
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white text-gray-800 rounded-bl-md border border-gray-100',
          message._pending ? 'opacity-70' : 'opacity-100',
        ]"
      >
        {{ message.message || message.content }}
      </div>

      <div
        class="flex items-center gap-1 mt-0.5 px-1"
        :class="isMine ? 'flex-row-reverse' : 'flex-row'"
      >
        <span class="text-[10px] text-gray-400">{{ formatTime(message.created_at) }}</span>

        <template v-if="isMine">
          <svg
            v-if="message._pending"
            class="w-3 h-3 text-gray-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else-if="message.is_read"
            class="w-3 h-3 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            class="w-3 h-3 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </template>

        <!-- Report peer message -->
        <div
          v-if="!isMine && allowReport && message.id && !String(message.id).startsWith('temp_')"
          class="relative"
          data-chat-bubble-menu
        >
          <button
            type="button"
            class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition"
            :aria-label="$t('chat.report.action')"
            @click.stop="menuOpen = !menuOpen"
          >
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          <div
            v-if="menuOpen"
            class="absolute left-0 bottom-full mb-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20"
          >
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
              @click="onReport"
            >
              {{ $t('chat.report.messageAction') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
