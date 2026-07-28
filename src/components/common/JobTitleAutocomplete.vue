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
  /** Scope autocomplete to this category (required for WE forms). */
  categoryId: {
    type: [Number, String, null],
    default: null,
  },
  /** When true, require categoryId before searching. */
  requireCategory: {
    type: Boolean,
    default: false,
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

const hasCategory = computed(
  () =>
    props.categoryId !== null &&
    props.categoryId !== undefined &&
    props.categoryId !== "",
);

const isDisabled = computed(
  () => props.disabled || (props.requireCategory && !hasCategory.value),
);

const emptyHint = computed(() => {
  if (props.requireCategory && !hasCategory.value) {
    return t("jobTitles.selectCategoryFirst");
  }
  if (loading.value) return t("jobTitles.searching");
  if (inputValue.value.trim().length < 2) return t("jobTitles.typeToSearch");
  return t("jobTitles.noResults");
});

watch(
  () => props.modelValue,
  (val) => {
    if (val !== inputValue.value) inputValue.value = val || "";
  },
);

watch(
  () => props.categoryId,
  () => {
    options.value = [];
    if (props.requireCategory && !hasCategory.value) {
      isOpen.value = false;
      loading.value = false;
      clearTimeout(searchTimeout);
      return;
    }
    if (inputValue.value.trim().length >= 2 && !isDisabled.value) {
      scheduleSearch(inputValue.value);
    }
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
  if (props.requireCategory && !hasCategory.value) {
    options.value = [];
    loading.value = false;
    return;
  }
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
    const res = await getJobTitles({
      search: q,
      page: 1,
      limit: 20,
      category_id: hasCategory.value ? props.categoryId : undefined,
    });
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
  if (isDisabled.value) return;
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
      :class="[
        inputClass,
        isDisabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : '',
      ]"
      :placeholder="
        requireCategory && !hasCategory
          ? t('jobTitles.selectCategoryFirst')
          : placeholder || t('jobTitles.placeholder')
      "
      :disabled="isDisabled"
      :value="inputValue"
      autocomplete="off"
      @input="inputValue = $event.target.value; onInput()"
      @focus="onFocus"
      @click="!isDisabled && (isOpen = true)"
    />

    <div
      v-if="isOpen && !isDisabled"
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
