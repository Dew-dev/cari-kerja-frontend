<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

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
})

const senderId = computed(
  () => props.message.sender?.id || props.message.sender_id,
)

const isMine = computed(() => {
  const myId = auth.user?.user_id || auth.user?.id
  const sid = senderId.value
  if (!myId || !sid) return false
  return String(sid) === String(myId)
})

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
</script>

<template>
  <div
    class="flex gap-2 mb-1 w-full"
    :class="isMine ? 'justify-end' : 'justify-start'"
  >
    <!-- Avatar (theirs) -->
    <div v-if="!isMine && showAvatar" class="shrink-0 self-end">
      <div class="w-7 h-7 rounded-full overflow-hidden bg-blue-100">
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
    <!-- Avatar placeholder to keep alignment when not shown -->
    <div v-else-if="!isMine && !showAvatar" class="w-7 shrink-0" />

    <!-- Bubble -->
    <div class="flex flex-col max-w-[70%]" :class="isMine ? 'items-end' : 'items-start'">
      <div
        class="px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words"
        :class="[
          isMine
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm',
          message._pending ? 'opacity-70' : 'opacity-100',
        ]"
      >
        {{ message.message || message.content }}
      </div>

      <!-- Timestamp + Read status -->
      <div class="flex items-center gap-1 mt-0.5 px-1">
        <span class="text-[10px] text-gray-400">{{ formatTime(message.created_at) }}</span>

        <!-- Read status (only for my messages) -->
        <template v-if="isMine">
          <!-- Pending (optimistic) -->
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
          <!-- Read -->
          <svg
            v-else-if="message.is_read"
            class="w-3 h-3 text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <!-- Delivered (sent, not yet read) -->
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
      </div>
    </div>
  </div>
</template>
