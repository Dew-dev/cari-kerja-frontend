import api from './api'

/**
 * Start a conversation (or retrieve existing one) with a participant.
 * @param {Object} data - { participant_id, participant_role }
 */
export const startConversation = (data) => api.post('/chat/start', data)

/**
 * Get all conversations for the currently authenticated user.
 */
export const getConversations = () => api.get('/chat/conversations')

/**
 * Get paginated messages for a conversation.
 * @param {string} conversationId
 * @param {Object} params - { page, limit, before_id }
 */
export const getMessages = (conversationId, params = {}) =>
  api.get(`/chat/${conversationId}/messages`, { params })

/**
 * Send a text message in a conversation.
 * @param {string} conversationId
 * @param {Object} data - { content }
 */
export const sendMessage = (conversationId, data) =>
  api.post(`/chat/${conversationId}/messages`, data)

/**
 * Mark all messages in a conversation as read.
 * @param {string} conversationId
 */
export const markAsRead = (conversationId) =>
  api.put(`/chat/${conversationId}/read`)
