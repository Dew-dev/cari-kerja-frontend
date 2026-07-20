import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  markAsRead as markAsReadApi,
  startConversation as startConversationApi,
} from '@/services/chat.api'
import { useAuthStore } from '@/stores/authStore'
import {
  isOwnMessage as matchOwnMessage,
  isSameId,
} from '@/utils/chatIdentity'

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
  return matchOwnMessage(message, useAuthStore().user)
}

function findOwnPendingIndex(list, message) {
  const text = getMessageText(message)
  return list.findIndex(
    (m) => m._pending && isOwnMessage(m) && getMessageText(m) === text,
  )
}

function findDuplicateIndex(list, message) {
  if (!message) return -1
  if (message.id) {
    const byId = list.findIndex((m) => m.id === message.id)
    if (byId !== -1) return byId
  }
  const text = getMessageText(message)
  if (!text || !isOwnMessage(message)) return -1
  return list.findIndex(
    (m) =>
      isOwnMessage(m) &&
      getMessageText(m) === text &&
      Math.abs(
        new Date(m.created_at) - new Date(message.created_at || Date.now()),
      ) < 15000,
  )
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
  const sending = ref(false)

  // ─── Getters ──────────────────────────────────────────────────────────────
  const totalUnread = computed(() =>
    conversations.value.reduce((sum, c) => sum + (c.unread_count || 0), 0),
  )

  const sortedConversations = computed(() =>
    [...conversations.value].sort((a, b) => {
      const ta = new Date(
        a.last_message_at || a.updated_at || a.created_at || 0,
      ).getTime()
      const tb = new Date(
        b.last_message_at || b.updated_at || b.created_at || 0,
      ).getTime()
      const aTime = Number.isFinite(ta) ? ta : 0
      const bTime = Number.isFinite(tb) ? tb : 0
      if (bTime !== aTime) return bTime - aTime
      // Stable tie-breaker — opening a chat must not reshuffle equals
      return String(a.id || '').localeCompare(String(b.id || ''))
    }),
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

  /** Find existing 1:1 conversation with a worker or recruiter (profile and/or users.id). */
  function findConversationWith({
    workerId,
    workerUserId,
    recruiterId,
    recruiterUserId,
  } = {}) {
    if (
      workerId == null &&
      workerUserId == null &&
      recruiterId == null &&
      recruiterUserId == null
    ) {
      return null
    }

    const matches = conversations.value.filter((c) => {
      if (workerId != null || workerUserId != null) {
        const ids = [
          c.worker?.id,
          c.worker?.user_id,
          c.worker_id,
          c.participant?.id,
          c.participant?.user_id,
        ]
        if (workerId != null && ids.some((id) => isSameId(id, workerId))) {
          return true
        }
        if (
          workerUserId != null &&
          ids.some((id) => isSameId(id, workerUserId))
        ) {
          return true
        }
      }
      if (recruiterId != null || recruiterUserId != null) {
        const ids = [
          c.recruiter?.id,
          c.recruiter?.user_id,
          c.recruiter_id,
          c.participant?.id,
          c.participant?.user_id,
        ]
        if (
          recruiterId != null &&
          ids.some((id) => isSameId(id, recruiterId))
        ) {
          return true
        }
        if (
          recruiterUserId != null &&
          ids.some((id) => isSameId(id, recruiterUserId))
        ) {
          return true
        }
      }
      return false
    })

    if (!matches.length) return null

    // Prefer most recently active thread if duplicates exist
    return [...matches].sort(
      (a, b) =>
        new Date(b.last_message_at || b.updated_at || 0) -
        new Date(a.last_message_at || a.updated_at || 0),
    )[0]
  }

  function upsertConversation(raw) {
    if (!raw) return null
    const normalized = normalizeConversation(raw)
    if (!normalized?.id) return null

    const idx = conversations.value.findIndex((c) => isSameId(c.id, normalized.id))
    if (idx === -1) {
      conversations.value = [normalized, ...conversations.value]
    } else {
      const next = [...conversations.value]
      next[idx] = { ...next[idx], ...normalized }
      conversations.value = next
    }
    return normalized
  }

  /**
   * Open an existing conversation with the participant, or start a new one.
   * Returns the conversation id to navigate to.
   *
   * One thread per recruiter↔worker pair (job_id is ignored for lookup/create).
   *
   * @param {{
   *   worker_id?: string|number,
   *   worker_profile_id?: string|number,
   *   recruiter_id?: string|number,
   *   recruiter_profile_id?: string|number,
   *   job_id?: string|number,
   * }} payload
   *   worker_id / recruiter_id = users.id (required by POST /chat/start)
   *   *_profile_id = workers.id / recruiters.id (for local list matching)
   */
  async function startOrOpenConversation(payload = {}) {
    const workerUserId = payload.worker_id
    const workerProfileId = payload.worker_profile_id
    const recruiterUserId = payload.recruiter_id
    const recruiterProfileId = payload.recruiter_profile_id

    if (workerUserId == null && recruiterUserId == null) {
      throw new Error('worker_id or recruiter_id (users.id) is required')
    }

    // Always refresh — store may be empty if user never opened /chat
    await fetchConversations()

    const existing = findConversationWith({
      workerId: workerProfileId,
      workerUserId,
      recruiterId: recruiterProfileId,
      recruiterUserId,
    })
    if (existing?.id) return existing.id

    // Omit job_id so backend looks up / creates the pair-scoped thread
    // (job-scoped uniqueness would spawn duplicate chats per vacancy)
    const apiPayload = {}
    if (workerUserId != null) apiPayload.worker_id = workerUserId
    if (recruiterUserId != null) apiPayload.recruiter_id = recruiterUserId

    const res = await startConversationApi(apiPayload)
    const data = res.data?.data ?? res.data
    const conversation =
      data && typeof data === 'object' && !Array.isArray(data) ? data : null
    const conversationId =
      conversation?.id ||
      conversation?.conversation_id ||
      data?.id ||
      data?.conversation_id

    if (!conversationId) throw new Error('No conversation ID returned')

    if (conversation) {
      upsertConversation(conversation)
    } else {
      await fetchConversations()
    }

    const matched = findConversationWith({
      workerId: workerProfileId,
      workerUserId,
      recruiterId: recruiterProfileId,
      recruiterUserId,
    })
    return matched?.id || conversationId
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

      // Do not touch conversation list fields on open — mutating them
      // re-runs sidebar sort and makes the order jump.

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
    // Lock: cegah double-send saat request sebelumnya belum selesai
    if (sending.value) return null
    sending.value = true

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
            // Match API: id = profile (workers/recruiters), user_id = users.id
            id: me.id,
            user_id: me.user_id,
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
      const tempIdx = list.findIndex((m) => m.id === tempId)
      const dupIdx = tempIdx === -1 ? findDuplicateIndex(list, sent) : -1
      const replaceIdx = tempIdx !== -1 ? tempIdx : dupIdx

      messages.value = {
        ...messages.value,
        [conversationId]:
          replaceIdx !== -1
            ? list.map((m, i) => (i === replaceIdx ? { ...sent, _pending: false } : m))
            : [...list, { ...sent, _pending: false }],
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
    } finally {
      sending.value = false
    }
  }

  async function markAsRead(conversationId) {
    try {
      await markAsReadApi(conversationId)
      const conv = conversations.value.find((c) => c.id === conversationId)
      // Only mutate when needed — avoids pointless sidebar re-sorts
      if (conv && (conv.unread_count || 0) > 0) {
        conv.unread_count = 0
      }

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
    const ownMessage = isOwnMessage(message)

    const list = messages.value[conversation_id]
    if (list) {
      const existingIdx = findDuplicateIndex(list, message)
      const pendingIdx = ownMessage ? findOwnPendingIndex(list, message) : -1
      let next = list

      if (existingIdx !== -1) {
        next = list.map((m, i) =>
          i === existingIdx ? { ...m, ...message, _pending: false } : m,
        )
      } else if (pendingIdx !== -1) {
        // Replace optimistic bubble with socket/REST payload
        next = list.map((m, i) =>
          i === pendingIdx ? { ...message, _pending: false } : m,
        )
      } else if (!ownMessage) {
        next = [...list, message]
      }
      // Own socket echo with no pending/dup: ignore — REST send already owns the UI

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
        [conversation_id]: messages.value[conversation_id].map((m) => {
          const sender = m.sender || { id: m.sender_id, user_id: m.sender_id }
          const isReader =
            isSameId(sender.id, reader_id) || isSameId(sender.user_id, reader_id)
          return isReader ? m : { ...m, is_read: true }
        }),
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
    sending,
    // Getters
    totalUnread,
    sortedConversations,
    getConversationMessages,
    isTyping,
    getTypingUsers,
    // Actions
    findConversationWith,
    startOrOpenConversation,
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
