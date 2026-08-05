<template>
  <div
    class="company-logo"
    :class="[
      `company-logo--${size}`,
      rounded,
      bordered ? 'company-logo--bordered' : '',
    ]"
  >
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
  Logos must never crop.
  Avoid flex+img width/height 100%: intrinsic min-size can exceed the frame,
  then overflow:hidden clips the mark. Absolute + max-width/max-height fixes that.
*/
.company-logo {
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  background: #fff;
  /* overflow visible — do not clip; image is constrained by max-* below */
  overflow: visible;
}

.company-logo--bordered {
  border: 1px solid #e5e7eb;
}

.company-logo__img {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: block;
  width: auto;
  height: auto;
  max-width: calc(100% - 0.7rem);
  max-height: calc(100% - 0.7rem);
  object-fit: contain;
  object-position: center;
}

.company-logo__fallback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 700;
  font-size: 0.875rem;
}

.company-logo--sm {
  width: 5rem;
  height: 3rem;
}

.company-logo--sm .company-logo__img {
  max-width: calc(100% - 0.5rem);
  max-height: calc(100% - 0.5rem);
}

.company-logo--md {
  width: 7.5rem;
  height: 4.25rem;
}

.company-logo--lg {
  width: 10rem;
  height: 5.5rem;
}

.company-logo--hero {
  width: 11rem;
  height: 6rem;
}

@media (min-width: 640px) {
  .company-logo--hero {
    width: 13rem;
    height: 7rem;
  }
}

.company-logo--card {
  width: 100%;
  height: 10rem;
}

@media (min-width: 640px) {
  .company-logo--card {
    width: 9rem;
    height: 6rem;
  }
}

.company-logo--fluid {
  width: 100%;
  aspect-ratio: 2 / 1;
  height: auto;
}

.company-logo--fluid .company-logo__img,
.company-logo--card .company-logo__img,
.company-logo--lg .company-logo__img,
.company-logo--hero .company-logo__img,
.company-logo--md .company-logo__img {
  max-width: calc(100% - 1rem);
  max-height: calc(100% - 1rem);
}
</style>
