<template>
  <div
    class="flex shrink-0 items-center justify-center bg-white"
    :class="frameClass"
  >
    <img
      v-if="displaySrc"
      :src="displaySrc"
      :alt="alt"
      class="h-auto max-h-full w-auto max-w-full object-contain object-center"
      @error="onError"
    />
    <span
      v-else
      class="flex items-center justify-center font-bold text-blue-600 bg-blue-50"
      :class="fallbackClass"
    >
      {{ initials }}
    </span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const DEFAULT_IMAGE = "/company-default-image.png";

const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "Company" },
  /** sm | md | lg | hero | fluid */
  size: { type: String, default: "md" },
  rounded: { type: String, default: "rounded-lg" },
  bordered: { type: Boolean, default: true },
  /** image = default PNG; initials = letter badge */
  fallback: { type: String, default: "image" },
});

const broken = ref(false);

watch(
  () => props.src,
  () => {
    broken.value = false;
  },
);

const displaySrc = computed(() => {
  if (props.src && !broken.value) return props.src;
  if (props.fallback === "initials") return "";
  return DEFAULT_IMAGE;
});

const initials = computed(() =>
  String(props.alt || "C")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join(""),
);

const frameClass = computed(() => {
  const sizes = {
    sm: "h-10 w-16 p-1.5",
    md: "h-14 w-24 p-2",
    lg: "h-20 w-32 p-2.5",
    hero: "h-24 w-36 sm:h-28 sm:w-40 p-3",
    card: "h-40 w-full sm:h-20 sm:w-28 p-2",
    fluid: "aspect-[2/1] w-full p-3",
  };
  return [
    sizes[props.size] || sizes.md,
    props.rounded,
    props.bordered ? "border border-gray-200" : "",
  ];
});

const fallbackClass = computed(() => {
  const map = {
    sm: "h-7 w-7 text-xs rounded-md",
    md: "h-9 w-9 text-sm rounded-md",
    lg: "h-12 w-12 text-lg rounded-lg",
    hero: "h-14 w-14 text-xl rounded-lg",
    card: "h-12 w-12 text-lg rounded-lg",
    fluid: "h-12 w-12 text-lg rounded-md",
  };
  return map[props.size] || map.md;
});

function onError(event) {
  if (props.fallback === "initials") {
    broken.value = true;
    return;
  }
  if (event?.target?.src && !String(event.target.src).includes("company-default-image.png")) {
    event.target.src = DEFAULT_IMAGE;
  } else {
    broken.value = true;
  }
}
</script>
