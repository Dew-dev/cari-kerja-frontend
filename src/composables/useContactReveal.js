import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { push } from "notivue";
import { revealWorkerContact } from "@/services/workers.api";
import { isRateLimitedError, getRetryAfterSeconds } from "@/utils/apiErrors";
import { useAuthStore } from "@/stores/authStore";

/**
 * Click-to-reveal for worker email / telephone (anti-scraping).
 * Never puts the raw value into the DOM until the reveal API succeeds.
 */
export function useContactReveal(workerRef) {
  const { t } = useI18n();
  const router = useRouter();
  const auth = useAuthStore();

  const revealedEmail = ref("");
  const revealedTelephone = ref("");
  const loadingEmail = ref(false);
  const loadingTelephone = ref(false);
  const cooldownSeconds = ref(0);
  let cooldownTimer = null;

  watch(
    () => workerRef.value?.id,
    () => {
      revealedEmail.value = "";
      revealedTelephone.value = "";
    },
  );

  function startCooldown(seconds) {
    const sec = Math.max(1, Math.floor(Number(seconds) || 900));
    cooldownSeconds.value = sec;
    if (cooldownTimer) clearInterval(cooldownTimer);
    cooldownTimer = setInterval(() => {
      cooldownSeconds.value -= 1;
      if (cooldownSeconds.value <= 0) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
        cooldownSeconds.value = 0;
      }
    }, 1000);
  }

  const contactRevealable = computed(() => {
    const w = workerRef.value || {};
    return w.contact_revealable || {};
  });

  const emailMasked = computed(() => {
    const w = workerRef.value || {};
    return w.email_masked || "";
  });

  const telephoneMasked = computed(() => {
    const w = workerRef.value || {};
    return w.telephone_masked || "";
  });

  /** Show row when masked / revealable / already revealed — never rely on raw email/phone in DOM. */
  const hasEmailRow = computed(
    () =>
      !!(
        revealedEmail.value ||
        emailMasked.value ||
        contactRevealable.value.email
      ),
  );

  const hasTelephoneRow = computed(
    () =>
      !!(
        revealedTelephone.value ||
        telephoneMasked.value ||
        contactRevealable.value.telephone
      ),
  );

  const canRevealEmail = computed(
    () => !revealedEmail.value && contactRevealable.value.email === true,
  );

  const canRevealTelephone = computed(
    () => !revealedTelephone.value && contactRevealable.value.telephone === true,
  );

  /** Display text — raw API email/phone never rendered until reveal succeeds. */
  const emailDisplay = computed(() => {
    if (revealedEmail.value) return revealedEmail.value;
    if (emailMasked.value) return emailMasked.value;
    return t("contactReveal.maskedEmail");
  });

  const telephoneDisplay = computed(() => {
    if (revealedTelephone.value) return revealedTelephone.value;
    if (telephoneMasked.value) return telephoneMasked.value;
    return t("contactReveal.maskedPhone");
  });

  const emailActionsReady = computed(() => !!revealedEmail.value);
  const telephoneActionsReady = computed(() => !!revealedTelephone.value);

  async function reveal(field) {
    const w = workerRef.value;
    const workerId = w?.id || w?.worker_id;
    if (!workerId) return;

    if (!auth.isLoggedIn) {
      push.info(t("contactReveal.loginRequired"));
      router.push({ path: "/login", query: { redirect: router.currentRoute.value.fullPath } });
      return;
    }

    if (cooldownSeconds.value > 0) {
      push.warning(
        t("contactReveal.rateLimited", { seconds: cooldownSeconds.value }),
      );
      return;
    }

    const isPhone = field === "telephone" || field === "phone";
    const loadingRef = isPhone ? loadingTelephone : loadingEmail;
    if (loadingRef.value) return;

    try {
      loadingRef.value = true;
      const res = await revealWorkerContact(workerId, isPhone ? "telephone" : "email");
      const payload = res?.data?.data ?? res?.data ?? {};
      const value = payload.value || "";
      if (!value) {
        push.error(t("contactReveal.failed"));
        return;
      }
      if (isPhone) revealedTelephone.value = value;
      else revealedEmail.value = value;
    } catch (err) {
      if (isRateLimitedError(err)) {
        const sec = getRetryAfterSeconds(err) ?? 900;
        startCooldown(sec);
        push.warning(t("contactReveal.rateLimited", { seconds: sec }));
        return;
      }
      if (err?.response?.status === 401) {
        push.info(t("contactReveal.loginRequired"));
        router.push({ path: "/login", query: { redirect: router.currentRoute.value.fullPath } });
        return;
      }
      push.error(err?.response?.data?.message || t("contactReveal.failed"));
    } finally {
      loadingRef.value = false;
    }
  }

  function revealEmail() {
    return reveal("email");
  }

  function revealTelephone() {
    return reveal("telephone");
  }

  function whatsappHref() {
    if (!revealedTelephone.value) return "";
    const digits = revealedTelephone.value.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }

  return {
    revealedEmail,
    revealedTelephone,
    loadingEmail,
    loadingTelephone,
    cooldownSeconds,
    hasEmailRow,
    hasTelephoneRow,
    canRevealEmail,
    canRevealTelephone,
    emailDisplay,
    telephoneDisplay,
    emailActionsReady,
    telephoneActionsReady,
    revealEmail,
    revealTelephone,
    whatsappHref,
  };
}
