import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  markAsRead as markAsReadApi,
} from '@/services/chat.api'

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
      conversations.value = res.data?.data || res.data || []
    } catch (err) {
      console.error('[Chat] Failed to fetch conversations:', err)
    } finally {
      loadingConversations.value = false
    }
  }

  async function fetchMessages(conversationId, page = 1) {
    const pagination = messagePagination.value[conversationId] || { page: 1, hasMore: true, loading: false }

    if (pagination.loading) return
    if (page > 1 && !pagination.hasMore) return

    try {
      messagePagination.value[conversationId] = { ...pagination, loading: true }
      loadingMessages.value = page === 1

      const res = await getMessages(conversationId, { page, limit: 50 })
      const data = res.data?.data || []
      const meta = res.data?.meta || {}

      if (!messages.value[conversationId]) {
        messages.value[conversationId] = []
      }

      if (page === 1) {
        messages.value[conversationId] = data
      } else {
        // Prepend older messages (avoid duplicates)
        const existingIds = new Set(messages.value[conversationId].map((m) => m.id))
        const newMessages = data.filter((m) => !existingIds.has(m.id))
        messages.value[conversationId] = [...newMessages, ...messages.value[conversationId]]
      }

      messagePagination.value[conversationId] = {
        page,
        hasMore: data.length === 50 || !!meta.has_more,
        loading: false,
      }
    } catch (err) {
      console.error('[Chat] Failed to fetch messages:', err)
      if (messagePagination.value[conversationId]) {
        messagePagination.value[conversationId].loading = false
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
    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const optimistic = {
      id: tempId,
      conversation_id: conversationId,
      content,
      is_read: false,
      _pending: true,
      created_at: new Date().toISOString(),
    }

    if (!messages.value[conversationId]) {
      messages.value[conversationId] = []
    }
    messages.value[conversationId].push(optimistic)

    // Update conversation last message optimistically
    const conv = conversations.value.find((c) => c.id === conversationId)
    if (conv) {
      conv.last_message = { content, created_at: optimistic.created_at }
      conv.updated_at = optimistic.created_at
    }

    try {
      const res = await sendMessageApi(conversationId, { content })
      const sent = res.data?.data || res.data

      // Replace optimistic with real message
      const idx = messages.value[conversationId].findIndex((m) => m.id === tempId)
      if (idx !== -1) {
        messages.value[conversationId][idx] = sent
      }

      return sent
    } catch (err) {
      // Remove optimistic on failure
      messages.value[conversationId] = messages.value[conversationId].filter((m) => m.id !== tempId)
      throw err
    }
  }

  async function markAsRead(conversationId) {
    try {
      await markAsReadApi(conversationId)
      const conv = conversations.value.find((c) => c.id === conversationId)
      if (conv) conv.unread_count = 0

      // Mark all messages as read in state
      if (messages.value[conversationId]) {
        messages.value[conversationId].forEach((m) => {
          m.is_read = true
        })
      }
    } catch (err) {
      console.error('[Chat] Failed to mark as read:', err)
    }
  }

  // ─── Real-time handlers (called by components using socket) ──────────────
  function handleIncomingMessage(message) {
    const { conversation_id } = message

    // Add message to state if conversation is loaded
    if (messages.value[conversation_id] !== undefined) {
      const existingIds = new Set(messages.value[conversation_id].map((m) => m.id))
      if (!existingIds.has(message.id)) {
        messages.value[conversation_id].push(message)
      }
    }

    // Update conversation list
    const conv = conversations.value.find((c) => c.id === conversation_id)
    if (conv) {
      conv.last_message = { content: message.content, created_at: message.created_at }
      conv.updated_at = message.created_at
      conv.unread_count = (conv.unread_count || 0) + 1
    } else {
      // New conversation not yet in list — refresh
      fetchConversations()
    }
  }

  function handleReadReceipt(data) {
    const { conversation_id, reader_id } = data
    if (messages.value[conversation_id]) {
      messages.value[conversation_id].forEach((m) => {
        if (m.sender_id !== reader_id) {
          m.is_read = true
        }
      })
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
    delete messages.value[conversationId]
    delete messagePagination.value[conversationId]
    delete typingUsers.value[conversationId]
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
