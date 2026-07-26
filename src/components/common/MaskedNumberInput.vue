<script setup>
import { ref, watch, nextTick } from "vue";
import {
  maskNumber,
  unmaskNumber,
  caretPosAfterDigits,
} from "@/utils/numberMask";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  inputClass: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "input"]);

const inputRef = ref(null);
const display = ref(maskNumber(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    const next = maskNumber(value);
    // Jangan overwrite saat user sedang mengetik nilai yang sama (hindari race / digit dobel)
    if (unmaskNumber(display.value) !== unmaskNumber(next)) {
      display.value = next;
    }
  },
);

function onBeforeInput(event) {
  // Blok karakter non-digit (termasuk koma/titik yang diketik manual)
  if (event.data && /\D/.test(event.data)) {
    event.preventDefault();
  }
}

function onInput(event) {
  const el = event.target;
  const cursor = el.selectionStart ?? el.value.length;
  const digitsBeforeCursor = unmaskNumber(el.value.slice(0, cursor)).length;

  const raw = unmaskNumber(el.value);
  const masked = maskNumber(raw);

  display.value = masked;
  emit("update:modelValue", raw);

  nextTick(() => {
    const node = inputRef.value;
    if (!node) return;
    const pos = caretPosAfterDigits(masked, digitsBeforeCursor);
    node.setSelectionRange(pos, pos);
  });
}

function onPaste(event) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text") ?? "";
  const el = event.target;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const merged = el.value.slice(0, start) + text + el.value.slice(end);
  const raw = unmaskNumber(merged);
  const masked = maskNumber(raw);
  display.value = masked;
  emit("update:modelValue", raw);
  nextTick(() => {
    const node = inputRef.value;
    if (!node) return;
    const pos = caretPosAfterDigits(masked, unmaskNumber(raw).length);
    node.setSelectionRange(pos, pos);
  });
}
</script>

<template>
  <input
    ref="inputRef"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :value="display"
    :placeholder="placeholder"
    :class="inputClass"
    @beforeinput="onBeforeInput"
    @input="onInput"
    @paste="onPaste"
  />
</template>
