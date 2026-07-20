<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  // { risk_score, flags: [{ code, detail, weight }] } — opsional
  moderation: {
    type: Object,
    default: null,
  },
  // Sembunyikan CTA "Lihat Daftar Lowongan" bila sudah berada di halaman jobs
  showViewJobs: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
        <i class="pi pi-eye text-xl text-blue-600"></i>
      </div>

      <h3 class="text-xl font-bold text-gray-900 mb-2">
        {{ $t('moderation.title') }}
      </h3>

      <p class="text-sm text-gray-600 mb-4">
        {{ $t('moderation.description') }}
      </p>

      <div
        v-if="moderation?.flags?.length"
        class="mb-6 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3"
      >
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {{ $t('moderation.flagsLabel') }}
        </p>
        <ul class="space-y-1">
          <li
            v-for="flag in moderation.flags"
            :key="flag.code"
            class="text-sm text-gray-700 flex items-start gap-2"
          >
            <i class="pi pi-flag text-xs text-amber-500 mt-0.5"></i>
            <span>{{ flag.detail || flag.code }}</span>
          </li>
        </ul>
        <p v-if="moderation.risk_score != null" class="mt-2 text-xs text-gray-500">
          {{ $t('moderation.riskScore') }}: {{ moderation.risk_score }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          @click="emit('close')"
          class="w-full rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 text-sm font-medium transition"
        >
          {{ $t('moderation.close') }}
        </button>
        <RouterLink
          v-if="showViewJobs"
          to="/recruiter/jobs"
          class="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-medium text-center transition"
        >
          {{ $t('moderation.viewJobs') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>
