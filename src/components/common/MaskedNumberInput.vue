<script setup>
import { maskNumber, unmaskNumber } from "@/utils/numberMask";

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

function onInput(event) {
  const raw = unmaskNumber(event.target.value);
  emit("update:modelValue", raw);
  emit("input", event);
  // Keep caret-friendly display after Vue re-renders :value
  event.target.value = maskNumber(raw);
}
</script>

<template>
  <input
    type="text"
    inputmode="numeric"
    :value="maskNumber(modelValue)"
    :placeholder="placeholder"
    :class="inputClass"
    @input="onInput"
  />
</template>
