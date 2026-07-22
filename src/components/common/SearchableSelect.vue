<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue"

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  value: {
    type: [String, Number],
    default: "",
  },
  placeholder: {
    type: String,
    default: "Select...",
  },
  id: {
    type: String,
    default: undefined,
  },
  ariaLabel: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(["change", "search"])

const isOpen = ref(false)
const inputValue = ref("")
const rootRef = ref(null)
const inputRef = ref(null)

/* =========================
   Sync value → label
========================= */
watch(
  () => props.value,
  (val) => {
    const found = props.options.find((o) => o.value == val)
    if (found) inputValue.value = found.label
  },
  { immediate: true }
)

/* =========================
   Search handler
========================= */
watch(inputValue, (val) => {
  emit("search", val)
})

function selectOption(opt) {
  inputValue.value = opt.label
  emit("change", opt.value)
  isOpen.value = false

  // blur biar nggak auto focus lagi
  requestAnimationFrame(() => {
    inputRef.value?.blur()
  })
}

/* =========================
   Click outside
========================= */
function onClickOutside(e) {
  if (!rootRef.value?.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside)
})
</script>

<template>
  <div ref="rootRef" class="relative w-full">
    <!-- INPUT -->
    <input
      ref="inputRef"
      type="text"
      class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      :id="id"
      :aria-label="ariaLabel"
      :placeholder="placeholder"
      v-model="inputValue"
      @focus="isOpen = true"
      @click="isOpen = true"
    />

    <!-- DROPDOWN -->
    <div
      v-if="isOpen"
      class="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-56 overflow-auto"
    >
      <div
        v-if="options.length === 0"
        class="px-3 py-2 text-sm text-gray-500"
      >
        No results
      </div>

      <div
        v-for="opt in options"
        :key="opt.value"
        @mousedown.prevent="selectOption(opt)"
        class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
      >
        {{ opt.label }}
      </div>
    </div>
  </div>
</template>
