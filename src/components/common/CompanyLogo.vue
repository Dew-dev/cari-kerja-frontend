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
  /** sm | md | lg | hero | card | fluid — all square for circular logos */
  size: { type: String, default: "md" },
  /** Always circular by default */
  rounded: { type: String, default: "rounded-full" },
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
  Circular company mark: equal width/height + overflow hidden.
  Logo stays fully visible via object-fit: contain on a white disc.
*/
.company-logo {
  box-sizing: border-box;
  flex-shrink: 0;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  max-height: 100%;
  padding: 0.35rem;
  background: #fff;
  overflow: hidden;
  border-radius: 9999px;
  aspect-ratio: 1 / 1;
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
  overflow: hidden;
  border-radius: 9999px;
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
  border-radius: 9999px;
}

.company-logo__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 700;
  font-size: 0.875rem;
}

.company-logo--sm {
  width: 2.75rem;
  height: 2.75rem;
  padding: 0.25rem;
}

.company-logo--sm .company-logo__fallback {
  font-size: 0.7rem;
}

.company-logo--md {
  width: 4rem;
  height: 4rem;
}

.company-logo--lg {
  width: 5rem;
  height: 5rem;
}

.company-logo--lg .company-logo__fallback {
  font-size: 1rem;
}

.company-logo--hero {
  width: 5.5rem;
  height: 5.5rem;
  padding: 0.4rem;
}

.company-logo--hero .company-logo__fallback {
  font-size: 1.15rem;
}

@media (min-width: 640px) {
  .company-logo--hero {
    width: 6.5rem;
    height: 6.5rem;
  }
}

.company-logo--card {
  width: 3.5rem;
  height: 3.5rem;
  padding: 0.3rem;
}

@media (min-width: 640px) {
  .company-logo--card {
    width: 4rem;
    height: 4rem;
  }
}

.company-logo--fluid {
  width: 100%;
  max-width: 5rem;
  height: auto;
  aspect-ratio: 1 / 1;
  padding: 0.4rem;
}
</style>
