import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  markAsRead as markAsReadApi,
} from '@/services/chat.api'
import { useAuthStore } from '@/stores/authStore'

function getSenderId(message) {
  return message?.sender?.id || message?.sender_id
}

function getCurrentUserId() {
  const auth = useAuthStore()
  const me = auth.user
  return me?.user_id || me?.id
}

function isSameUser(a, b) {
  if (!a || !b) return false
  return String(a) === String(b)
}

/** Normalize message / last_message text from various API shapes */
export function getMessageText(message) {
  if (message == null) return ''
  if (typeof message === 'string') return message
  return (
    message.message ||
    message.content ||
    message.text ||
    message.body ||
    message.last_message ||
    ''
  )
}

function isOwnMessage(message) {
  return isSameUser(getSenderId(message), getCurrentUserId())
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.messages)) return payload.messages
  if (Array.isArray(payload?.conversations)) return payload.conversations
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function normalizeConversation(raw) {
  if (!raw || typeof raw !== 'object') return raw

  const id = raw.id || raw.conversation_id
  const last = raw.last_message ?? raw.latest_message ?? raw.lastMessage
  const lastText = getMessageText(last)
  const lastAt =
    (typeof last === 'object' && last?.created_at) ||
    raw.last_message_at ||
    raw.updated_at ||
    raw.created_at

  return {
    ...raw,
    id,
    last_message:
      typeof last === 'object' && last
        ? { ...last, message: lastText || getMessageText(last), created_at: lastAt }
        : lastText
          ? { message: lastText, created_at: lastAt }
          : null,
  }
}

export const useChatStore = defineStore('chat', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const conversations = ref([])
  const messages = ref({}) // Record<conversationId, Message[]>
  const typingUsers = ref({}) // Record<conversationId, Record<userId, boolean>>
  const messagePagination = ref({}) // Record<conversationId, { page, hasMore, loading }>

  const loadingConversations = ref(false)
  const loadingMessages = ref(false)

  // ─── Getters ──────────────────────────────────────────────────────────────
  const totalUnread = computed(() =>
    conversations.value.reduce((sum, c) => sum + (c.unread_count || 0), 0),
  )

  const sortedConversations = computed(() =>
    [...conversations.value].sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
    ),
  )

  function getConversationMessages(conversationId) {
    return messages.value[conversationId] || []
  }

  function isTyping(conversationId, userId) {
    return !!typingUsers.value[conversationId]?.[userId]
  }

  function getTypingUsers(conversationId) {
    return Object.keys(typingUsers.value[conversationId] || {})
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function fetchConversations() {
    try {
      loadingConversations.value = true
      const res = await getConversations()
      const list = extractList(res.data?.data ?? res.data)
      conversations.value = list.map(normalizeConversation)
    } catch (err) {
      console.error('[Chat] Failed to fetch conversations:', err)
    } finally {
      loadingConversations.value = false
    }
  }

  async function fetchMessages(conversationId, page = 1) {
    if (!conversationId) return

    const pagination = messagePagination.value[conversationId] || {
      page: 1,
      hasMore: true,
      loading: false,
    }

    // Page 1 always refreshes; only block older pages while in-flight
    if (page > 1 && pagination.loading) return
    if (page > 1 && !pagination.hasMore) return

    try {
      messagePagination.value = {
        ...messagePagination.value,
        [conversationId]: { ...pagination, loading: true },
      }
      loadingMessages.value = page === 1

      const res = await getMessages(conversationId, { page, limit: 50 })
      const body = res.data?.data ?? res.data
      const data = extractList(body)
      const meta = res.data?.meta || body?.meta || {}

      const existing = messages.value[conversationId] || []
      const nextMessages =
        page === 1
          ? data
          : [
              ...data.filter((m) => !existing.some((e) => e.id === m.id)),
              ...existing,
            ]

      messages.value = {
        ...messages.value,
        [conversationId]: nextMessages,
      }

      // Keep list preview in sync with latest message
      if (page === 1 && nextMessages.length > 0) {
        const latest = nextMessages[nextMessages.length - 1]
        const conv = conversations.value.find((c) => c.id === conversationId)
        if (conv) {
          conv.last_message = {
            message: getMessageText(latest),
            created_at: latest.created_at,
          }
          conv.updated_at = latest.created_at || conv.updated_at
        }
      }

      messagePagination.value = {
        ...messagePagination.value,
        [conversationId]: {
          page,
          hasMore:
            data.length >= (meta.limit || 50) ||
            page < (meta.total_pages || 0) ||
            !!meta.has_more,
          loading: false,
        },
      }
    } catch (err) {
      console.error('[Chat] Failed to fetch messages:', err)
      messagePagination.value = {
        ...messagePagination.value,
        [conversationId]: {
          ...(messagePagination.value[conversationId] || pagination),
          loading: false,
        },
      }
    } finally {
      loadingMessages.value = false
    }
  }

  async function loadMoreMessages(conversationId) {
    const pagination = messagePagination.value[conversationId]
    if (!pagination || !pagination.hasMore || pagination.loading) return
    await fetchMessages(conversationId, pagination.page + 1)
  }

  async function sendMessage(conversationId, content) {
    const auth = useAuthStore()
    const me = auth.user
    const tempId = `temp_${Date.now()}`
    const optimistic = {
      id: tempId,
      conversation_id: conversationId,
      message: content,
      type: 'text',
      is_read: false,
      _pending: true,
      created_at: new Date().toISOString(),
      sender: me
        ? {
            id: me.user_id || me.id,
            username: me.username,
            name: me.name,
            avatar_url: me.avatar_url,
            role_id: me.role_id,
          }
        : undefined,
    }

    const prev = messages.value[conversationId] || []
    messages.value = {
      ...messages.value,
      [conversationId]: [...prev, optimistic],
    }

    const conv = conversations.value.find((c) => c.id === conversationId)
    if (conv) {
      conv.last_message = { message: content, created_at: optimistic.created_at }
      conv.updated_at = optimistic.created_at
    }

    try {
      const res = await sendMessageApi(conversationId, { message: content, type: 'text' })
      const sent = res.data?.data || res.data
      const list = messages.value[conversationId] || []
      const idx = list.findIndex((m) => m.id === tempId)

      messages.value = {
        ...messages.value,
        [conversationId]:
          idx !== -1
            ? list.map((m, i) => (i === idx ? sent : m))
            : [...list, sent],
      }

      return sent
    } catch (err) {
      messages.value = {
        ...messages.value,
        [conversationId]: (messages.value[conversationId] || []).filter(
          (m) => m.id !== tempId,
        ),
      }
      throw err
    }
  }

  async function markAsRead(conversationId) {
    try {
      await markAsReadApi(conversationId)
      const conv = conversations.value.find((c) => c.id === conversationId)
      if (conv) conv.unread_count = 0

      if (messages.value[conversationId]) {
        messages.value = {
          ...messages.value,
          [conversationId]: messages.value[conversationId].map((m) => ({
            ...m,
            is_read: true,
          })),
        }
      }
    } catch (err) {
      console.error('[Chat] Failed to mark as read:', err)
    }
  }

  function handleIncomingMessage(message) {
    const { conversation_id } = message
    const myId = getCurrentUserId()
    const ownMessage = isOwnMessage(message)

    const list = messages.value[conversation_id]
    if (list) {
      const existingIdx = list.findIndex((m) => m.id === message.id)
      let next = list

      if (existingIdx !== -1) {
        next = list.map((m, i) =>
          i === existingIdx ? { ...m, ...message } : m,
        )
      } else if (ownMessage) {
        const pendingIdx = list.findIndex(
          (m) =>
            m._pending &&
            isSameUser(getSenderId(m), myId) &&
            getMessageText(m) === getMessageText(message),
        )
        if (pendingIdx !== -1) {
          next = list.map((m, i) => (i === pendingIdx ? message : m))
        }
      } else {
        next = [...list, message]
      }

      if (next !== list) {
        messages.value = {
          ...messages.value,
          [conversation_id]: next,
        }
      }
    }

    const conv = conversations.value.find((c) => c.id === conversation_id)
    if (conv) {
      conv.last_message = {
        message: getMessageText(message),
        created_at: message.created_at,
      }
      conv.updated_at = message.created_at
      if (!ownMessage) {
        conv.unread_count = (conv.unread_count || 0) + 1
      }
    } else {
      fetchConversations()
    }
  }

  function handleReadReceipt(data) {
    const { conversation_id, reader_id } = data
    if (messages.value[conversation_id]) {
      messages.value = {
        ...messages.value,
        [conversation_id]: messages.value[conversation_id].map((m) =>
          isSameUser(getSenderId(m), reader_id) ? m : { ...m, is_read: true },
        ),
      }
    }
  }

  function setTyping(conversationId, userId, isTypingNow) {
    if (!typingUsers.value[conversationId]) {
      typingUsers.value[conversationId] = {}
    }
    if (isTypingNow) {
      typingUsers.value[conversationId][userId] = true
    } else {
      delete typingUsers.value[conversationId][userId]
    }
  }

  function clearConversation(conversationId) {
    // Keep messages cached — wiping on unmount races with fetch and
    // shows "No messages yet" when reopening a chat.
    const { [conversationId]: _typing, ...restTyping } = typingUsers.value
    typingUsers.value = restTyping

    if (messagePagination.value[conversationId]) {
      messagePagination.value = {
        ...messagePagination.value,
        [conversationId]: {
          ...messagePagination.value[conversationId],
          loading: false,
        },
      }
    }
  }

  return {
    // State
    conversations,
    messages,
    typingUsers,
    messagePagination,
    loadingConversations,
    loadingMessages,
    // Getters
    totalUnread,
    sortedConversations,
    getConversationMessages,
    isTyping,
    getTypingUsers,
    // Actions
    fetchConversations,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead,
    handleIncomingMessage,
    handleReadReceipt,
    setTyping,
    clearConversation,
  }
})
