<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  /** Jika diisi, report menarget pesan spesifik */
  messageId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['close', 'submit'])

const { t } = useI18n()
const reason = ref('')
const error = ref('')

const presets = [
  'spam',
  'harassment',
  'scam',
  'inappropriate',
  'other',
]

watch(
  () => props.show,
  (open) => {
    if (open) {
      reason.value = ''
      error.value = ''
    }
  },
)

function selectPreset(key) {
  reason.value = t(`chat.report.reasons.${key}`)
  error.value = ''
}

function submit() {
  const trimmed = reason.value.trim()
  if (trimmed.length < 3) {
    error.value = t('chat.report.reasonTooShort')
    return
  }
  if (trimmed.length > 1000) {
    error.value = t('chat.report.reasonTooLong')
    return
  }
  emit('submit', { reason: trimmed, message_id: props.messageId || undefined })
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <h3 class="text-lg font-bold text-gray-900 mb-1">
        {{ messageId ? $t('chat.report.messageTitle') : $t('chat.report.title') }}
      </h3>
      <p class="text-sm text-gray-600 mb-4">
        {{ $t('chat.report.description') }}
      </p>

      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="key in presets"
          :key="key"
          type="button"
          class="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          @click="selectPreset(key)"
        >
          {{ $t(`chat.report.reasons.${key}`) }}
        </button>
      </div>

      <textarea
        v-model="reason"
        rows="4"
        maxlength="1000"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :placeholder="$t('chat.report.placeholder')"
      />
      <p class="mt-1 text-xs text-right text-gray-400">{{ reason.length }}/1000</p>
      <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>

      <div class="mt-4 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 text-sm font-medium transition"
          :disabled="loading"
          @click="emit('close')"
        >
          {{ $t('chat.report.cancel') }}
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2.5 text-sm font-medium transition"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? $t('chat.report.submitting') : $t('chat.report.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>
