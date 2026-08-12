<script setup>
import { toRef } from "vue";
import { useContactReveal } from "@/composables/useContactReveal";

const props = defineProps({
  worker: { type: Object, required: true },
  /** Show Call / Email / WhatsApp action row after reveal */
  showActions: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
});

const {
  hasEmailRow,
  hasTelephoneRow,
  canRevealEmail,
  canRevealTelephone,
  emailDisplay,
  telephoneDisplay,
  emailActionsReady,
  telephoneActionsReady,
  loadingEmail,
  loadingTelephone,
  cooldownSeconds,
  revealedEmail,
  revealedTelephone,
  revealEmail,
  revealTelephone,
  whatsappHref,
} = useContactReveal(toRef(props, "worker"));
</script>

<template>
  <div :class="compact ? 'space-y-1.5 text-sm' : 'w-full space-y-3 text-sm text-left'">
    <div v-if="hasEmailRow" class="flex items-start gap-2 text-gray-600">
      <svg
        class="w-5 h-5 text-gray-400 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <div class="min-w-0 flex-1 flex flex-wrap items-center gap-2">
        <span class="break-all">{{ emailDisplay }}</span>
        <button
          v-if="canRevealEmail"
          type="button"
          class="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
          :disabled="loadingEmail || cooldownSeconds > 0"
          @click="revealEmail"
        >
          {{ loadingEmail ? $t("contactReveal.showing") : $t("contactReveal.show") }}
        </button>
      </div>
    </div>

    <div v-if="hasTelephoneRow" class="flex items-start gap-2 text-gray-600">
      <svg
        class="w-5 h-5 text-gray-400 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
      <div class="min-w-0 flex-1 flex flex-wrap items-center gap-2">
        <span>{{ telephoneDisplay }}</span>
        <button
          v-if="canRevealTelephone"
          type="button"
          class="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
          :disabled="loadingTelephone || cooldownSeconds > 0"
          @click="revealTelephone"
        >
          {{ loadingTelephone ? $t("contactReveal.showing") : $t("contactReveal.show") }}
        </button>
      </div>
    </div>

    <div
      v-if="showActions && (emailActionsReady || telephoneActionsReady)"
      class="flex justify-around flex-wrap items-center gap-3 pt-3 border-t mt-2"
    >
      <a
        v-if="telephoneActionsReady"
        :href="`tel:${revealedTelephone}`"
        class="flex items-center justify-center gap-2 flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-orange-200 min-w-fit"
      >
        {{ $t("contactActions.call") }}
      </a>
      <a
        v-if="emailActionsReady"
        :href="`mailto:${revealedEmail}`"
        class="flex items-center justify-center gap-2 flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-blue-200 min-w-fit"
      >
        {{ $t("contactActions.email") }}
      </a>
      <a
        v-if="telephoneActionsReady && whatsappHref()"
        :href="whatsappHref()"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-center gap-2 flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-green-200 min-w-fit"
      >
        {{ $t("contactActions.whatsapp") }}
      </a>
    </div>
  </div>
</template>
