<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { useSocket } from '@/composables/useSocket'

import ConversationItem from '@/components/chat/ConversationItem.vue'
import ConversationSkeleton from '@/components/chat/ConversationSkeleton.vue'
import EmptyState from '@/components/chat/EmptyState.vue'
import UnreadBadge from '@/components/chat/UnreadBadge.vue'
import ConversationDetail from './ConversationDetail.vue'

// ─── Composables ──────────────────────────────────────────────────────────────
const auth = useAuthStore()
const chatStore = useChatStore()
const { on, off } = useSocket()
const route = useRoute()
const router = useRouter()

// ─── State ────────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const mobileShowDetail = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────────────
const activeConversationId = computed(() => route.params.conversationId || null)

const filteredConversations = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return chatStore.sortedConversations

  return chatStore.sortedConversations.filter((c) => {
    const participant =
      auth.user?.role === 'recruiter'
        ? c.worker || c.participant
        : c.recruiter || c.participant
    return participant?.name?.toLowerCase().includes(q)
  })
})

// ─── Navigation ───────────────────────────────────────────────────────────────
function selectConversation(conversation) {
  router.push({ name: 'chat-detail', params: { conversationId: conversation.id } })
  mobileShowDetail.value = true
}

function goBack() {
  mobileShowDetail.value = false
  router.push({ name: 'chat' })
}

// ─── Real-time: update conversation list on new messages ─────────────────────
function handleIncomingMessage(message) {
  chatStore.handleIncomingMessage(message)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await chatStore.fetchConversations()

  // If URL already has conversationId, show detail
  if (activeConversationId.value) {
    mobileShowDetail.value = true
  }

  // Listen for messages even when detail view is not open (update list unread count)
  on('receive_message', handleIncomingMessage)
})

// When navigating away, clean up
onBeforeUnmount(() => {
  off('receive_message', handleIncomingMessage)
})

// When route changes externally (back button, etc.)
watch(activeConversationId, (id) => {
  mobileShowDetail.value = !!id
})
</script>

<template>
  <!--
    Layout:
    - Desktop (md+): sidebar (320px) + detail panel side by side
    - Mobile: either list OR detail (based on mobileShowDetail)
  -->
  <div
    class="flex bg-gray-50"
    style="height: calc(100vh - 64px)"
  >
    <!-- ─── LEFT SIDEBAR: Conversation List ─────────────────────────────────── -->
    <aside
      class="flex flex-col bg-white border-r border-gray-100"
      :class="[
        'md:w-80 md:flex md:shrink-0',
        mobileShowDetail ? 'hidden' : 'flex w-full',
      ]"
    >
      <!-- Header -->
      <div class="px-4 py-4 border-b border-gray-100 shrink-0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-900">
            {{ $t('chat.title') }}
          </h2>
          <UnreadBadge :count="chatStore.totalUnread" />
        </div>

        <!-- Search -->
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('chat.searchPlaceholder')"
            class="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Skeleton -->
        <ConversationSkeleton v-if="chatStore.loadingConversations" />

        <!-- Empty -->
        <EmptyState
          v-else-if="!chatStore.loadingConversations && filteredConversations.length === 0"
          :title="searchQuery ? $t('chat.noResults') : $t('chat.noConversations')"
          :subtitle="searchQuery ? '' : $t('chat.noConversationsSubtitle')"
          icon="chat"
        />

        <!-- Items -->
        <div v-else>
          <ConversationItem
            v-for="conv in filteredConversations"
            :key="conv.id"
            :conversation="conv"
            :active="conv.id === activeConversationId"
            @click="selectConversation(conv)"
          />
        </div>
      </div>
    </aside>

    <!-- ─── RIGHT PANEL: Detail or Empty State ────────────────────────────── -->
    <main
      class="flex-1 flex flex-col min-w-0"
      :class="mobileShowDetail ? 'flex' : 'hidden md:flex'"
    >
      <!-- Conversation detail -->
      <ConversationDetail
        v-if="activeConversationId"
        :key="activeConversationId"
        :conversation-id="activeConversationId"
        @back="goBack"
      />

      <!-- Empty state (desktop only, when no conversation selected) -->
      <EmptyState
        v-else
        :title="$t('chat.selectConversation')"
        :subtitle="$t('chat.selectConversationSubtitle')"
        icon="select"
        class="flex-1"
      />
    </main>
  </div>
</template>
