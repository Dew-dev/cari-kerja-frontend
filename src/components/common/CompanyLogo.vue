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
/* Fixed frame + object-fit:contain so the full logo is always visible (never cropped). */
.company-logo {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  background: #fff;
  overflow: hidden;
}

.company-logo--bordered {
  border: 1px solid #e5e7eb;
}

.company-logo__img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
}

.company-logo__fallback {
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

/* Landscape frames — wide enough for typical company wordmarks */
.company-logo--sm {
  width: 4.5rem;
  height: 2.75rem;
  padding: 0.35rem;
}

.company-logo--md {
  width: 7rem;
  height: 4rem;
  padding: 0.5rem;
}

.company-logo--lg {
  width: 9rem;
  height: 5rem;
  padding: 0.6rem;
}

.company-logo--hero {
  width: 10rem;
  height: 5.5rem;
  padding: 0.75rem;
}

@media (min-width: 640px) {
  .company-logo--hero {
    width: 11.5rem;
    height: 6.5rem;
  }
}

.company-logo--card {
  width: 100%;
  height: 10rem;
  padding: 0.75rem;
}

@media (min-width: 640px) {
  .company-logo--card {
    width: 8rem;
    height: 5.5rem;
  }
}

.company-logo--fluid {
  width: 100%;
  aspect-ratio: 2 / 1;
  height: auto;
  padding: 0.75rem;
}

.company-logo--fluid .company-logo__img {
  position: absolute;
  inset: 0.75rem;
  width: auto;
  height: auto;
  max-width: calc(100% - 1.5rem);
  max-height: calc(100% - 1.5rem);
  margin: auto;
}
</style>
