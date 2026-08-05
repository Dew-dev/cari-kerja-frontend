<template>
  <div
    class="company-logo"
    :class="[
      `company-logo--${size}`,
      rounded,
      bordered ? 'company-logo--bordered' : '',
    ]"
  >
    <div class="company-logo__frame">
      <img
        v-if="displaySrc"
        :src="displaySrc"
        :alt="alt"
        class="company-logo__img"
        @error="onError"
      />
      <span
        v-else
        class="company-logo__fallback"
      >
        {{ initials }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const DEFAULT_IMAGE = "/company-default-image.png";

const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "Company" },
  /** sm | md | lg | hero | card | fluid */
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

<style scoped>
/*
  Full logo always visible inside the wrapper.
  Outer = fixed box + padding. Inner frame fills content box.
  Img uses width/height 100% + object-fit:contain so the mark scales
  down to the wrapper width/height and is never cropped.
*/
.company-logo {
  box-sizing: border-box;
  flex-shrink: 1;
  min-width: 0;
  min-height: 0;
  /* Never exceed the parent wrapper — this was causing visible “cropping”. */
  max-width: 100%;
  max-height: 100%;
  padding: 0.5rem;
  background: #fff;
}

.company-logo--bordered {
  border: 1px solid #e5e7eb;
}

.company-logo__frame {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: block;
  position: relative;
}

.company-logo__img {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: contain;
  object-position: center center;
}

.company-logo__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 0.375rem;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 700;
  font-size: 0.875rem;
}

.company-logo--sm {
  width: 5.5rem;
  height: 3.25rem;
  padding: 0.35rem;
}

.company-logo--md {
  width: 8rem;
  height: 4.5rem;
}

.company-logo--lg {
  width: 11rem;
  height: 6rem;
}

.company-logo--hero {
  width: 12rem;
  height: 6.5rem;
  padding: 0.65rem;
}

@media (min-width: 640px) {
  .company-logo--hero {
    width: 14rem;
    height: 7.5rem;
  }
}

.company-logo--card {
  width: 100%;
  height: 10rem;
  padding: 0.75rem;
}

@media (min-width: 640px) {
  .company-logo--card {
    width: 10rem;
    height: 6.5rem;
  }
}

.company-logo--fluid {
  width: 100%;
  aspect-ratio: 2 / 1;
  height: auto;
  padding: 0.75rem;
}
</style>
