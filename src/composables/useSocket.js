import { ref, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'
import { handleAccountSuspended } from '@/services/api'
import { isAccountRestrictedError, errorMessage } from '@/utils/apiErrors'
import router from '@/router'

// Singleton socket instance shared across all components
let _socket = null
const _connected = ref(false)
const _instanceCount = ref(0)
let _isRedirectingToMaintenance = false

function handleSocketAuthFailure(err) {
  const msg = errorMessage(err)

  if (isAccountRestrictedError(err) || msg.toLowerCase().includes('suspended')) {
    const auth = useAuthStore()
    // logout() calls disconnectSocket(), which also stops the reconnection loop
    handleAccountSuspended(auth)
    return true
  }

  if (msg.includes('MAINTENANCE_MODE')) {
    if (_socket) {
      _socket.io.opts.reconnection = false
    }
    disconnectSocket()
    if (
      !_isRedirectingToMaintenance &&
      router.currentRoute.value.name !== 'maintenance'
    ) {
      _isRedirectingToMaintenance = true
      router.replace({ name: 'maintenance' }).finally(() => {
        setTimeout(() => {
          _isRedirectingToMaintenance = false
        }, 2000)
      })
    }
    return true
  }

  return false
}

function createSocket(token) {
  const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_FILE_STORAGE_URL || ''

  const socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    withCredentials: true,
  })

  socket.on('connect', () => {
    _connected.value = true
  })

  socket.on('disconnect', () => {
    _connected.value = false
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
    handleSocketAuthFailure(err)
  })

  // Runtime errors from chat_handler (send_message, join, …)
  socket.on('error', (payload) => {
    handleSocketAuthFailure(payload)
  })

  return socket
}

/**
 * Composable to use the singleton Socket.IO instance.
 * Automatically cleans up listeners on component unmount.
 * Does NOT disconnect the socket on unmount to preserve the shared connection.
 */
export function useSocket() {
  const auth = useAuthStore()

  if (!_socket && auth.token) {
    _socket = createSocket(auth.token)
  }

  _instanceCount.value++

  // Track listeners registered by this component instance so we can remove them
  const _listeners = []

  function on(event, handler) {
    if (!_socket) return
    _socket.on(event, handler)
    _listeners.push({ event, handler })
  }

  function off(event, handler) {
    if (!_socket) return
    _socket.off(event, handler)
    _listeners.splice(
      _listeners.findIndex((l) => l.event === event && l.handler === handler),
      1,
    )
  }

  function emit(event, ...args) {
    if (!_socket) return
    _socket.emit(event, ...args)
  }

  // Clean up THIS component's listeners on unmount, not the global socket
  onUnmounted(() => {
    _listeners.forEach(({ event, handler }) => {
      _socket?.off(event, handler)
    })
    _listeners.length = 0
    _instanceCount.value--
  })

  return {
    socket: _socket,
    connected: _connected,
    on,
    off,
    emit,
  }
}

/**
 * Disconnect and destroy the singleton socket.
 * Call this on logout.
 */
export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect()
    _socket = null
    _connected.value = false
  }
}

/**
 * Reconnect socket with a fresh token (e.g. after token refresh).
 */
export function reconnectSocket() {
  const auth = useAuthStore()
  disconnectSocket()
  if (auth.token) {
    _socket = createSocket(auth.token)
  }
}
