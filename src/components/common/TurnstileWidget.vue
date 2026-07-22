<script>
// Loader script Turnstile dibagikan antar semua instance widget
let turnstileScriptPromise = null;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = (err) => {
      turnstileScriptPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}
</script>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits(["verified", "expired"]);

// Selaras dengan TURNSTILE_SECRET_KEY di backend: tanpa site key,
// widget tidak dirender dan backend melewatkan verifikasi CAPTCHA.
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
const container = ref(null);
let widgetId = null;

onMounted(async () => {
  if (!siteKey || !container.value) return;
  try {
    const turnstile = await loadTurnstileScript();
    widgetId = turnstile.render(container.value, {
      sitekey: siteKey,
      callback: (token) => emit("verified", token),
      "expired-callback": () => emit("expired"),
      "error-callback": () => emit("expired"),
    });
  } catch (err) {
    console.error("Failed to load Turnstile widget:", err);
  }
});

onBeforeUnmount(() => {
  if (widgetId !== null && window.turnstile) {
    window.turnstile.remove(widgetId);
    widgetId = null;
  }
});

function reset() {
  emit("expired");
  if (widgetId !== null && window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}

defineExpose({ reset });
</script>

<template>
  <div v-if="siteKey" ref="container" class="my-2"></div>
</template>
