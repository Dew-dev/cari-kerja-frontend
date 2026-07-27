<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getJobTitles } from "@/services/job_titles.api";

const props = defineProps({
  /** Display / free-text title (always kept). */
  modelValue: {
    type: String,
    default: "",
  },
  /** Selected taxonomy id, or null/"" when free-text. */
  titleId: {
    type: [String, null],
    default: null,
  },
  placeholder: {
    type: String,
    default: "",
  },
  inputClass: {
    type: String,
    default:
      "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(["update:modelValue", "update:titleId", "select"]);

const { t } = useI18n();

const inputValue = ref(props.modelValue || "");
const options = ref([]);
const isOpen = ref(false);
const loading = ref(false);
const rootRef = ref(null);
const inputRef = ref(null);

let searchTimeout = null;
let requestId = 0;

const emptyHint = computed(() =>
  loading.value
    ? t("jobTitles.searching")
    : inputValue.value.trim().length < 2
      ? t("jobTitles.typeToSearch")
      : t("jobTitles.noResults"),
);

watch(
  () => props.modelValue,
  (val) => {
    if (val !== inputValue.value) inputValue.value = val || "";
  },
);

function emitText(text, clearId = false) {
  emit("update:modelValue", text);
  if (clearId) emit("update:titleId", null);
}

function onInput() {
  const text = inputValue.value;
  emitText(text, true);
  isOpen.value = true;
  scheduleSearch(text);
}

function scheduleSearch(text) {
  clearTimeout(searchTimeout);
  const q = String(text || "").trim();
  if (q.length < 2) {
    options.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  searchTimeout = setTimeout(() => fetchOptions(q), 300);
}

async function fetchOptions(q) {
  const id = ++requestId;
  try {
    const res = await getJobTitles({ search: q, page: 1, limit: 20 });
    if (id !== requestId) return;
    options.value = res.data?.data || [];
  } catch {
    if (id !== requestId) return;
    options.value = [];
  } finally {
    if (id === requestId) loading.value = false;
  }
}

function selectOption(opt) {
  const name = opt?.name || "";
  const id = opt?.id || null;
  inputValue.value = name;
  emit("update:modelValue", name);
  emit("update:titleId", id);
  emit("select", opt);
  isOpen.value = false;
  options.value = [];
  requestAnimationFrame(() => inputRef.value?.blur());
}

function onFocus() {
  isOpen.value = true;
  if (inputValue.value.trim().length >= 2) scheduleSearch(inputValue.value);
}

function onClickOutside(e) {
  if (!rootRef.value?.contains(e.target)) isOpen.value = false;
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
  clearTimeout(searchTimeout);
});
</script>

<template>
  <div ref="rootRef" class="relative w-full">
    <input
      :id="id"
      ref="inputRef"
      type="text"
      :class="inputClass"
      :placeholder="placeholder || t('jobTitles.placeholder')"
      :disabled="disabled"
      :value="inputValue"
      autocomplete="off"
      @input="inputValue = $event.target.value; onInput()"
      @focus="onFocus"
      @click="isOpen = true"
    />

    <div
      v-if="isOpen && !disabled"
      class="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-56 overflow-auto"
    >
      <div
        v-if="!options.length"
        class="px-3 py-2 text-sm text-gray-500"
      >
        {{ emptyHint }}
      </div>
      <button
        v-for="opt in options"
        :key="opt.id"
        type="button"
        class="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
        @mousedown.prevent="selectOption(opt)"
      >
        {{ opt.name }}
      </button>
      <p
        v-if="options.length || inputValue.trim().length >= 2"
        class="px-3 py-1.5 text-[11px] text-gray-400 border-t"
      >
        {{ t("jobTitles.freeTextHint") }}
      </p>
    </div>
  </div>
</template>
