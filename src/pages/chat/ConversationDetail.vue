<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { useSocket } from '@/composables/useSocket'
import { getSenderKey } from '@/utils/chatIdentity'
import { push } from 'notivue'

import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatBubble from '@/components/chat/ChatBubble.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import MessageSkeleton from '@/components/chat/MessageSkeleton.vue'
import EmptyState from '@/components/chat/EmptyState.vue'

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps({
  conversationId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['back'])

// ─── Composables ──────────────────────────────────────────────────────────────
const auth = useAuthStore()
const chatStore = useChatStore()
const {
  conversations,
  messages: messagesMap,
  messagePagination,
  loadingMessages,
} = storeToRefs(chatStore)
const { on, off, emit: socketEmit, connected } = useSocket()

// ─── State ────────────────────────────────────────────────────────────────────
const messageText = ref('')
const sending = ref(false)
const messagesRef = ref(null)
const chatInputRef = ref(null)
const sentinelRef = ref(null)
const isAtBottom = ref(true)
const loadingOlder = ref(false)
const initializing = ref(true)

// ─── Computed ─────────────────────────────────────────────────────────────────
const conversation = computed(() =>
  conversations.value.find((c) => c.id === props.conversationId),
)

const messages = computed(() => messagesMap.value[props.conversationId] || [])

const pagination = computed(() => messagePagination.value[props.conversationId])

const participant = computed(() => {
  const me = auth.user
  if (!me || !conversation.value) return null
  if (me.role === 'recruiter') {
    return conversation.value.worker || conversation.value.participant
  }
  return conversation.value.recruiter || conversation.value.participant
})

const typingUsersList = computed(() =>
  chatStore.getTypingUsers(props.conversationId),
)

const someoneTyping = computed(() => typingUsersList.value.length > 0)

const loading = computed(
  () => loadingMessages.value && messages.value.length === 0,
)

// ─── Scroll helpers ────────────────────────────────────────────────────────────
async function scrollToBottom(behavior = 'auto') {
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(resolve))

  const el = messagesRef.value
  if (!el) return

  // Scroll fully to end so latest messages sit above the sticky input
  const top = el.scrollHeight
  if (behavior === 'smooth') {
    el.scrollTo({ top, behavior: 'smooth' })
  } else {
    el.scrollTop = top
  }
  isAtBottom.value = true
}

function onScroll() {
  if (!messagesRef.value || initializing.value || loadingOlder.value) return
  const { scrollTop, scrollHeight, clientHeight } = messagesRef.value
  isAtBottom.value = scrollHeight - scrollTop - clientHeight < 60
}

// ─── Infinite scroll (older messages) ─────────────────────────────────────────
let observer = null

function setupIntersectionObserver() {
  if (!sentinelRef.value || !messagesRef.value) return

  observer?.disconnect()
  observer = new IntersectionObserver(
    async ([entry]) => {
      if (
        !entry.isIntersecting ||
        initializing.value ||
        loadingOlder.value ||
        !pagination.value?.hasMore ||
        pagination.value?.loading
      ) {
        return
      }

      loadingOlder.value = true
      const prevScrollHeight = messagesRef.value?.scrollHeight || 0

      await chatStore.loadMoreMessages(props.conversationId)

      // Preserve scroll position after prepending older messages
      await nextTick()
      if (messagesRef.value) {
        const newScrollHeight = messagesRef.value.scrollHeight
        messagesRef.value.scrollTop = newScrollHeight - prevScrollHeight
      }
      loadingOlder.value = false
    },
    { root: messagesRef.value, threshold: 0 },
  )

  observer.observe(sentinelRef.value)
}

// ─── Socket events ─────────────────────────────────────────────────────────────
function handleReceiveMessage(message) {
  if (message.conversation_id !== props.conversationId) return
  chatStore.handleIncomingMessage(message)

  // Auto-scroll if user is at bottom
  if (isAtBottom.value) {
    scrollToBottom('smooth')
  }

  // Mark read since conversation is open
  chatStore.markAsRead(props.conversationId)
  socketEmit('read_message', { conversationId: props.conversationId })
}

function handleTyping({ conversationId, userId }) {
  if (conversationId !== props.conversationId) return
  const me = auth.user
  if (
    userId &&
    me &&
    (String(userId) === String(me.user_id) || String(userId) === String(me.id))
  ) {
    return
  }
  chatStore.setTyping(conversationId, userId, true)
}

function handleStopTyping({ conversationId, userId }) {
  if (conversationId !== props.conversationId) return
  chatStore.setTyping(conversationId, userId, false)
}

function handleReadReceipt(data) {
  chatStore.handleReadReceipt(data)
}

// ─── My typing ────────────────────────────────────────────────────────────────
function onTyping() {
  socketEmit('typing', { conversationId: props.conversationId })
}

function onStopTyping() {
  socketEmit('stop_typing', { conversationId: props.conversationId })
}

// ─── Send message ─────────────────────────────────────────────────────────────
async function handleSend() {
  const content = messageText.value.trim()
  if (!content) return

  messageText.value = ''
  sending.value = true

  try {
    await chatStore.sendMessage(props.conversationId, content)
    await scrollToBottom('smooth')
  } catch (err) {
    push.error('Failed to send message')
  } finally {
    sending.value = false
  }
}

// ─── Date separators ─────────────────────────────────────────────────────────
function formatDateLabel(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
}

function showDateSeparator(messages, index) {
  if (index === 0) return true
  const curr = new Date(messages[index].created_at).toDateString()
  const prev = new Date(messages[index - 1].created_at).toDateString()
  return curr !== prev
}

function showAvatar(messages, index) {
  if (index === messages.length - 1) return true
  const curr = messages[index]
  const next = messages[index + 1]
  return getSenderKey(curr) !== getSenderKey(next)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
async function init() {
  initializing.value = true
  observer?.disconnect()

  await chatStore.fetchMessages(props.conversationId)
  // Wait until message bubbles are painted, then jump to latest
  await scrollToBottom('auto')
  await scrollToBottom('auto')

  await chatStore.markAsRead(props.conversationId)

  initializing.value = false
  await nextTick()
  setupIntersectionObserver()
  chatInputRef.value?.focus()
}

onMounted(() => {
  // Join conversation room
  socketEmit('join_conversation', { conversationId: props.conversationId })

  // Register socket listeners
  on('receive_message', handleReceiveMessage)
  on('typing', handleTyping)
  on('stop_typing', handleStopTyping)
  on('read_message', handleReadReceipt)

  init()
})

onBeforeUnmount(() => {
  socketEmit('leave_conversation', { conversationId: props.conversationId })
  off('receive_message', handleReceiveMessage)
  off('typing', handleTyping)
  off('stop_typing', handleStopTyping)
  off('read_message', handleReadReceipt)
  observer?.disconnect()

  chatStore.clearConversation(props.conversationId)
})

// Re-init when conversationId changes (user clicks different conversation)
watch(
  () => props.conversationId,
  (newId, oldId) => {
    if (oldId) {
      socketEmit('leave_conversation', { conversationId: oldId })
      chatStore.clearConversation(oldId)
    }
    socketEmit('join_conversation', { conversationId: newId })
    observer?.disconnect()
    init()
  },
)

// Scroll to bottom when new messages arrive (not during initial open)
watch(
  messages,
  async () => {
    if (!initializing.value && isAtBottom.value) {
      await scrollToBottom('smooth')
    }
  },
  { deep: false },
)

// Focus composer once socket is ready
watch(connected, (val) => {
  if (val && !initializing.value) chatInputRef.value?.focus()
})

// Scroll when typing indicator appears
watch(someoneTyping, async (val) => {
  if (val && isAtBottom.value) await scrollToBottom('smooth')
})
</script>

<template>
  <div class="flex flex-col h-full min-h-0 overflow-hidden bg-[#f0f2f5]">
    <!-- Sticky header -->
    <div class="shrink-0 z-20">
      <ChatHeader
        :name="participant?.name || participant?.company_name || '...'"
        :avatar-url="participant?.avatar_url"
        :profile-id="participant?.id"
        :profile-role="participant?.role || (auth.user?.role === 'recruiter' ? 'worker' : 'recruiter')"
        show-back
        @back="emit('back')"
      />
    </div>

    <!-- Scrollable messages only -->
    <div
      ref="messagesRef"
      class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-4"
      @scroll="onScroll"
    >
      <div ref="sentinelRef" class="h-1" />

      <div v-if="loadingOlder" class="flex justify-center py-2">
        <svg class="w-4 h-4 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>

      <MessageSkeleton v-if="loading" />

      <EmptyState
        v-else-if="!loading && messages.length === 0"
        :title="$t('chat.noMessages')"
        :subtitle="$t('chat.startConversation')"
        icon="chat"
        class="h-full"
      />

      <template v-else>
        <div class="max-w-3xl mx-auto">
          <template v-for="(message, index) in messages" :key="message.id">
            <div
              v-if="showDateSeparator(messages, index)"
              class="flex items-center gap-3 my-4"
            >
              <div class="flex-1 h-px bg-gray-200/80" />
              <span class="text-[10px] text-gray-500 font-medium whitespace-nowrap bg-white/70 px-2.5 py-0.5 rounded-full">
                {{ formatDateLabel(message.created_at) }}
              </span>
              <div class="flex-1 h-px bg-gray-200/80" />
            </div>

            <ChatBubble
              :message="message"
              :show-avatar="showAvatar(messages, index)"
              :participant-name="participant?.name"
              :participant-avatar="participant?.avatar_url"
              :class="index === messages.length - 1 ? 'mb-1' : ''"
            />
          </template>

          <div v-if="someoneTyping" class="pl-2 pb-1">
            <TypingIndicator :name="participant?.name" />
          </div>
        </div>
      </template>
    </div>

    <!-- Sticky input (outside scroll) -->
    <ChatInput
      ref="chatInputRef"
      v-model="messageText"
      :sending="sending"
      :disabled="!connected"
      autofocus
      @send="handleSend"
      @typing="onTyping"
      @stop-typing="onStopTyping"
    />
  </div>
</template>
