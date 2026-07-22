<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { push } from 'notivue'
import { listBlocks, unblockUser } from '@/services/chat.api'
import { chatErrorI18nKey } from '@/utils/apiErrors'

const router = useRouter()
const { t } = useI18n()

const blocks = ref([])
const loading = ref(true)
const unblockingId = ref(null)

async function loadBlocks() {
  loading.value = true
  try {
    const res = await listBlocks()
    const data = res.data?.data || res.data || []
    blocks.value = Array.isArray(data) ? data : []
  } catch (err) {
    push.error(err?.response?.data?.message || t('chat.blocks.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function handleUnblock(userId) {
  if (!userId || unblockingId.value) return
  unblockingId.value = userId
  try {
    await unblockUser(userId)
    blocks.value = blocks.value.filter(
      (b) => String(b.blocked_user_id) !== String(userId),
    )
    push.success(t('chat.block.unblocked'))
  } catch (err) {
    const key = chatErrorI18nKey(err)
    if (key) push.warning(t(key))
    else push.error(err?.response?.data?.message || t('chat.block.unblockFailed'))
  } finally {
    unblockingId.value = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}

onMounted(loadBlocks)
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button
          type="button"
          class="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition"
          @click="router.push({ name: 'chat' })"
        >
          <i class="pi pi-arrow-left"></i>
        </button>
        <div>
          <h1 class="text-xl font-bold text-gray-900">{{ $t('chat.blocks.title') }}</h1>
          <p class="text-sm text-gray-500">{{ $t('chat.blocks.subtitle') }}</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">
        {{ $t('chat.blocks.loading') }}
      </div>

      <div
        v-else-if="blocks.length === 0"
        class="rounded-xl bg-white border border-gray-100 p-8 text-center text-gray-500 text-sm"
      >
        {{ $t('chat.blocks.empty') }}
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="block in blocks"
          :key="block.id || block.blocked_user_id"
          class="flex items-center justify-between gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate font-mono">
              {{ String(block.blocked_user_id || '').slice(0, 8) }}…
            </p>
            <p class="text-xs text-gray-400">{{ formatDate(block.created_at) }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            :disabled="unblockingId === block.blocked_user_id"
            @click="handleUnblock(block.blocked_user_id)"
          >
            {{
              unblockingId === block.blocked_user_id
                ? $t('chat.blocks.unblocking')
                : $t('chat.block.unblock')
            }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
