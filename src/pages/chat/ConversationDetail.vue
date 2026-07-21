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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { useSocket } from '@/composables/useSocket'
import { getSenderKey } from '@/utils/chatIdentity'
import {
  isRateLimitedError,
  isChatBlockedError,
  isChatArchivedError,
  isMessageTooLongError,
  isAccountRestrictedError,
  isMaintenanceModeError,
  getRetryAfterSeconds,
  errorMessage,
  chatErrorI18nKey,
} from '@/utils/apiErrors'
import { handleAccountSuspended } from '@/services/api'
import {
  reportConversation,
  blockUser,
  unblockUser,
  listBlocks,
} from '@/services/chat.api'
import { push } from 'notivue'
import { useI18n } from 'vue-i18n'

import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatBubble from '@/components/chat/ChatBubble.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import MessageSkeleton from '@/components/chat/MessageSkeleton.vue'
import EmptyState from '@/components/chat/EmptyState.vue'
import ReportChatModal from '@/components/chat/ReportChatModal.vue'

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
const router = useRouter()
const {
  conversations,
  messages: messagesMap,
  messagePagination,
  loadingMessages,
  sending,
} = storeToRefs(chatStore)
const { on, off, emit: socketEmit, connected } = useSocket()
const { t } = useI18n()

// ─── State ────────────────────────────────────────────────────────────────────
const messageText = ref('')
const messagesRef = ref(null)
const chatInputRef = ref(null)
const sentinelRef = ref(null)
const isAtBottom = ref(true)
const loadingOlder = ref(false)
const initializing = ref(true)

const isPeerBlocked = ref(false)
const composerLock = ref(null) // 'blocked' | 'archived' | null
const actionLoading = ref(false)
const showReportModal = ref(false)
const reportMessageId = ref(null)
const reportLoading = ref(false)
const showBlockConfirm = ref(false)
const sendCooldown = ref(0)
let sendCooldownTimer = null

const CHAT_MESSAGE_MAX = 5000

function startSendCooldown(seconds) {
  const sec = Math.max(1, Math.floor(Number(seconds) || 60))
  sendCooldown.value = sec
  if (sendCooldownTimer) clearInterval(sendCooldownTimer)
  sendCooldownTimer = setInterval(() => {
    sendCooldown.value -= 1
    if (sendCooldown.value <= 0) {
      clearInterval(sendCooldownTimer)
      sendCooldownTimer = null
      sendCooldown.value = 0
    }
  }, 1000)
}

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

/** users.id lawan bicara — wajib untuk POST /chat/block */
const peerUserId = computed(() => participant.value?.user_id || null)

const isArchived = computed(() => {
  const status = String(conversation.value?.status || '').toUpperCase()
  return status === 'ARCHIVED' || composerLock.value === 'archived'
})

const composerDisabled = computed(
  () =>
    !connected.value ||
    isPeerBlocked.value ||
    isArchived.value ||
    composerLock.value === 'blocked' ||
    sendCooldown.value > 0,
)

const composerHint = computed(() => {
  if (isPeerBlocked.value || composerLock.value === 'blocked') {
    return t('chat.composer.blocked')
  }
  if (isArchived.value) {
    return t('chat.composer.archived')
  }
  if (sendCooldown.value > 0) {
    return t('chat.composer.rateLimited', { seconds: sendCooldown.value })
  }
  return null
})

const typingUsersList = computed(() =>
  chatStore.getTypingUsers(props.conversationId),
)

const someoneTyping = computed(() => typingUsersList.value.length > 0)

const loading = computed(
  () => loadingMessages.value && messages.value.length === 0,
)

// ─── Error helpers ────────────────────────────────────────────────────────────
function notifyChatError(err) {
  const key = chatErrorI18nKey(err)
  if (key) {
    push.warning(t(key))
    return true
  }
  return false
}

function applySendErrorState(err) {
  if (isChatBlockedError(err)) {
    composerLock.value = 'blocked'
    isPeerBlocked.value = true
  } else if (isChatArchivedError(err)) {
    composerLock.value = 'archived'
  }
}

// ─── Blocks ───────────────────────────────────────────────────────────────────
async function refreshBlockState() {
  const peerId = peerUserId.value
  if (!peerId) {
    isPeerBlocked.value = false
    return
  }
  try {
    const res = await listBlocks()
    const list = res.data?.data || res.data || []
    const rows = Array.isArray(list) ? list : []
    isPeerBlocked.value = rows.some(
      (b) => String(b.blocked_user_id) === String(peerId),
    )
    if (isPeerBlocked.value) composerLock.value = 'blocked'
  } catch (err) {
    console.error('[Chat] Failed to load blocks:', err)
  }
}

// ─── Scroll helpers ────────────────────────────────────────────────────────────
async function scrollToBottom(behavior = 'auto') {
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(resolve))

  const el = messagesRef.value
  if (!el) return

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

  if (isAtBottom.value) {
    scrollToBottom('smooth')
  }

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
  if (composerDisabled.value) return
  socketEmit('typing', { conversationId: props.conversationId })
}

function onStopTyping() {
  socketEmit('stop_typing', { conversationId: props.conversationId })
}

// ─── Send message ─────────────────────────────────────────────────────────────
async function handleSend() {
  const content = messageText.value.trim()
  if (!content || sending.value || composerDisabled.value) return

  if (content.length > CHAT_MESSAGE_MAX) {
    push.warning(t('chat.errors.messageTooLong', { max: CHAT_MESSAGE_MAX }))
    return
  }

  messageText.value = ''

  try {
    await chatStore.sendMessage(props.conversationId, content)
    await scrollToBottom('smooth')
  } catch (err) {
    if (!messageText.value) messageText.value = content
    applySendErrorState(err)
    if (isMaintenanceModeError(err)) {
      router.replace({ name: 'maintenance' })
      return
    }
    if (isAccountRestrictedError(err)) {
      handleAccountSuspended(auth)
      return
    }
    if (isMessageTooLongError(err)) {
      push.warning(t('chat.errors.messageTooLong', { max: CHAT_MESSAGE_MAX }))
      return
    }
    if (isRateLimitedError(err)) {
      const retryAfter = getRetryAfterSeconds(err) ?? 60
      startSendCooldown(retryAfter)
      push.warning(t('captcha.rateLimited'))
    } else if (notifyChatError(err)) {
      // handled
    } else {
      push.error(t('chat.failedToSendMessage'))
    }
  }
}

function handleSocketError(payload) {
  const msg = errorMessage(payload)
  if (!msg) return

  if (isAccountRestrictedError(payload) || msg.includes('ACCOUNT_RESTRICTED')) {
    handleAccountSuspended(auth)
    return
  }
  if (msg.includes('MAINTENANCE_MODE')) {
    router.replace({ name: 'maintenance' })
    return
  }
  if (isMessageTooLongError(payload)) {
    push.warning(t('chat.errors.messageTooLong', { max: CHAT_MESSAGE_MAX }))
  }
}

// ─── Report / Block ───────────────────────────────────────────────────────────
function openReport(messageId = null) {
  reportMessageId.value = messageId
  showReportModal.value = true
}

async function submitReport({ reason, message_id }) {
  reportLoading.value = true
  try {
    await reportConversation(props.conversationId, {
      reason,
      ...(message_id ? { message_id } : {}),
    })
    push.success(t('chat.report.success'))
    showReportModal.value = false
    reportMessageId.value = null
  } catch (err) {
    if (!notifyChatError(err)) {
      push.error(err?.response?.data?.message || t('chat.report.failed'))
    }
  } finally {
    reportLoading.value = false
  }
}

function confirmBlock() {
  showBlockConfirm.value = true
}

async function handleBlock() {
  const peerId = peerUserId.value
  if (!peerId || actionLoading.value) return

  actionLoading.value = true
  showBlockConfirm.value = false
  try {
    await blockUser(peerId)
    isPeerBlocked.value = true
    composerLock.value = 'blocked'
    push.success(t('chat.block.success'))
    // Keluar dari thread setelah block
    chatStore.clearConversation(props.conversationId)
    emit('back')
    router.push({ name: 'chat' })
  } catch (err) {
    if (!notifyChatError(err)) {
      push.error(err?.response?.data?.message || t('chat.block.failed'))
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleUnblock() {
  const peerId = peerUserId.value
  if (!peerId || actionLoading.value) return

  actionLoading.value = true
  try {
    await unblockUser(peerId)
    isPeerBlocked.value = false
    if (composerLock.value === 'blocked') composerLock.value = null
    push.success(t('chat.block.unblocked'))
  } catch (err) {
    if (!notifyChatError(err)) {
      push.error(err?.response?.data?.message || t('chat.block.unblockFailed'))
    }
  } finally {
    actionLoading.value = false
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
  composerLock.value = null
  isPeerBlocked.value = false

  await chatStore.fetchMessages(props.conversationId)
  await scrollToBottom('auto')
  await scrollToBottom('auto')

  await chatStore.markAsRead(props.conversationId)
  await refreshBlockState()

  if (String(conversation.value?.status || '').toUpperCase() === 'ARCHIVED') {
    composerLock.value = 'archived'
  }

  initializing.value = false
  await nextTick()
  setupIntersectionObserver()
  if (!composerDisabled.value) chatInputRef.value?.focus()
}

onMounted(() => {
  socketEmit('join_conversation', { conversationId: props.conversationId })

  on('receive_message', handleReceiveMessage)
  on('typing', handleTyping)
  on('stop_typing', handleStopTyping)
  on('read_message', handleReadReceipt)
  on('error', handleSocketError)

  init()
})

onBeforeUnmount(() => {
  socketEmit('leave_conversation', { conversationId: props.conversationId })
  off('receive_message', handleReceiveMessage)
  off('typing', handleTyping)
  off('stop_typing', handleStopTyping)
  off('read_message', handleReadReceipt)
  off('error', handleSocketError)
  observer?.disconnect()

  if (sendCooldownTimer) clearInterval(sendCooldownTimer)

  chatStore.clearConversation(props.conversationId)
})

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

watch(
  messages,
  async () => {
    if (!initializing.value && isAtBottom.value) {
      await scrollToBottom('smooth')
    }
  },
  { deep: false },
)

watch(connected, (val) => {
  if (val && !initializing.value && !composerDisabled.value) {
    chatInputRef.value?.focus()
  }
})

watch(someoneTyping, async (val) => {
  if (val && isAtBottom.value) await scrollToBottom('smooth')
})

watch(peerUserId, () => {
  if (!initializing.value) refreshBlockState()
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
        :is-blocked="isPeerBlocked"
        :action-loading="actionLoading"
        show-back
        @back="emit('back')"
        @report="openReport()"
        @block="confirmBlock"
        @unblock="handleUnblock"
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
              @report="openReport"
            />
          </template>

          <div v-if="someoneTyping && !composerDisabled" class="pl-2 pb-1">
            <TypingIndicator :name="participant?.name" />
          </div>
        </div>
      </template>
    </div>

    <!-- Composer lock banner -->
    <div
      v-if="composerHint"
      class="shrink-0 px-4 py-2.5 bg-gray-100 border-t border-gray-200 text-center"
    >
      <p class="text-sm text-gray-600">{{ composerHint }}</p>
      <button
        v-if="isPeerBlocked"
        type="button"
        class="mt-1 text-sm font-medium text-blue-600 hover:underline"
        :disabled="actionLoading"
        @click="handleUnblock"
      >
        {{ $t('chat.block.unblock') }}
      </button>
    </div>

    <!-- Sticky input -->
    <ChatInput
      ref="chatInputRef"
      v-model="messageText"
      :sending="sending"
      :disabled="composerDisabled"
      autofocus
      @send="handleSend"
      @typing="onTyping"
      @stop-typing="onStopTyping"
    />

    <!-- Report modal -->
    <ReportChatModal
      :show="showReportModal"
      :loading="reportLoading"
      :message-id="reportMessageId"
      @close="showReportModal = false; reportMessageId = null"
      @submit="submitReport"
    />

    <!-- Block confirm -->
    <div
      v-if="showBlockConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showBlockConfirm = false"
    >
      <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-gray-900 mb-2">{{ $t('chat.block.confirmTitle') }}</h3>
        <p class="text-sm text-gray-600 mb-5">{{ $t('chat.block.confirmDescription') }}</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 text-sm font-medium"
            @click="showBlockConfirm = false"
          >
            {{ $t('chat.report.cancel') }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-sm font-medium"
            :disabled="actionLoading"
            @click="handleBlock"
          >
            {{ $t('chat.block.action') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
