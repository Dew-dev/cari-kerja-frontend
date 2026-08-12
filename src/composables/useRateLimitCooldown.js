import { ref, computed, onUnmounted } from "vue";
import { getRetryAfterSeconds } from "@/utils/apiErrors";

/**
 * Shared cooldown timer for API rate limits (e.g. job search 60/min).
 */
export function useRateLimitCooldown(defaultSeconds = 300) {
  const cooldownSeconds = ref(0);
  let timer = null;

  function clear() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    cooldownSeconds.value = 0;
  }

  function start(seconds) {
    const sec = Math.max(1, Math.floor(Number(seconds) || defaultSeconds));
    cooldownSeconds.value = sec;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      cooldownSeconds.value -= 1;
      if (cooldownSeconds.value <= 0) clear();
    }, 1000);
  }

  /** Start from an axios error (uses retry_after_seconds / Retry-After). */
  function startFromError(err, fallback = defaultSeconds) {
    start(getRetryAfterSeconds(err) ?? fallback);
  }

  onUnmounted(clear);

  const isCoolingDown = computed(() => cooldownSeconds.value > 0);

  return {
    cooldownSeconds,
    isCoolingDown,
    start,
    startFromError,
    clear,
  };
}
