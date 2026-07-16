<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import UnreadBadge from './UnreadBadge.vue'

const auth = useAuthStore()
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || ''

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

// Determine the OTHER participant (not the current user)
const participant = computed(() => {
  const me = auth.user
  if (!me) return null

  if (me.role === 'recruiter') {
    return props.conversation.worker || props.conversation.participant
  }
  return props.conversation.recruiter || props.conversation.participant
})

const lastMessage = computed(() => props.conversation.last_message)

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return date.toLocaleDateString([], { day: '2-digit', month: 'short' })
}

function truncate(str, len = 42) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}
</script>

<template>
  <button
    class="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 focus:outline-none"
    :class="active ? 'bg-blue-50 border-r-2 border-blue-600' : ''"
    @click="emit('click', conversation)"
  >
    <!-- Avatar -->
    <div class="relative shrink-0">
      <div class="w-11 h-11 rounded-full overflow-hidden bg-blue-100">
        <img
          v-if="participant?.avatar_url"
          :src="`${fileStorageUrl}${participant.avatar_url}`"
          :alt="participant?.name"
          class="w-full h-full object-cover"
        />
        <span
          v-else
          class="w-full h-full flex items-center justify-center text-base font-bold text-blue-600"
        >
          {{ participant?.name?.charAt(0)?.toUpperCase() || '?' }}
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-1 mb-0.5">
        <p
          class="text-sm font-semibold truncate"
          :class="(conversation.unread_count || 0) > 0 ? 'text-gray-900' : 'text-gray-700'"
        >
          {{ participant?.name || '...' }}
        </p>
        <span class="text-[10px] text-gray-400 shrink-0">
          {{ formatTime(conversation.updated_at || lastMessage?.created_at) }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-1">
        <p
          class="text-xs truncate"
          :class="(conversation.unread_count || 0) > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'"
        >
          {{ truncate(lastMessage?.message || lastMessage?.content) || $t('chat.noMessages') }}
        </p>
        <UnreadBadge :count="conversation.unread_count || 0" />
      </div>
    </div>
  </button>
</template>
