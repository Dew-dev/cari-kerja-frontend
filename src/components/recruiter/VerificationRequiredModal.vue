<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  // Tampilkan tombol "Simpan sebagai Draft" (untuk alur create/edit job)
  allowSaveDraft: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "save-draft"]);
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4">
        <i class="pi pi-shield text-xl text-amber-600"></i>
      </div>

      <h3 class="text-xl font-bold text-gray-900 mb-2">
        {{ $t('verification.title') }}
      </h3>

      <p class="text-sm text-gray-600 mb-6">
        {{ $t('verification.description') }}
      </p>

      <div class="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          @click="emit('close')"
          class="w-full rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 text-sm font-medium transition"
        >
          {{ $t('verification.close') }}
        </button>
        <button
          v-if="allowSaveDraft"
          type="button"
          @click="emit('save-draft')"
          class="w-full rounded-lg bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 text-sm font-medium transition"
        >
          {{ $t('verification.saveDraft') }}
        </button>
        <RouterLink
          to="/recruiter/verification"
          class="w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-sm font-medium text-center transition"
        >
          {{ $t('verification.cta') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>
