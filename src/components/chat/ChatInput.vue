<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  sending: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'send', 'typing', 'stop-typing'])

const textareaRef = ref(null)

const canSend = computed(() => props.modelValue.trim().length > 0 && !props.sending)

let typingTimer = null

function focus() {
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

function onInput(e) {
  emit('update:modelValue', e.target.value)

  emit('typing')
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    emit('stop-typing')
  }, 1500)

  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (canSend.value) {
      handleSend()
    }
  }
}

function handleSend() {
  if (!canSend.value) return
  clearTimeout(typingTimer)
  emit('stop-typing')
  emit('send')

  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
  focus()
}

watch(
  () => [props.autofocus, props.disabled],
  ([shouldFocus, isDisabled]) => {
    if (shouldFocus && !isDisabled) focus()
  },
  { immediate: true },
)

defineExpose({ focus })
</script>

<template>
  <div
    class="shrink-0 border-t border-gray-200/80 bg-white/95 backdrop-blur-sm px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
  >
    <div class="flex items-end gap-2 max-w-3xl mx-auto">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        rows="1"
        :disabled="disabled || sending"
        :placeholder="$t('chat.typeMessage')"
        class="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-300 focus:bg-white transition leading-relaxed max-h-[120px] overflow-y-auto disabled:opacity-60"
        @input="onInput"
        @keydown="onKeydown"
      />

      <button
        type="button"
        :disabled="!canSend"
        class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm"
        :class="
          canSend
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
        "
        @click="handleSend"
      >
        <svg
          v-if="sending"
          class="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <svg v-else class="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  </div>
</template>
