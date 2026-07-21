<script setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

onMounted(() => {
  document.title = t("maintenance.pageTitle");
});

function goHome() {
  router.push("/");
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-slate-50 to-white">
    <div class="w-full max-w-md text-center">
      <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <i class="pi pi-wrench text-2xl text-amber-600"></i>
      </div>
      <h1 class="text-2xl font-bold text-slate-900 mb-2">
        {{ $t("maintenance.title") }}
      </h1>
      <p class="text-sm text-slate-600 mb-8 leading-relaxed">
        {{ $t("maintenance.description") }}
      </p>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 text-sm font-medium transition"
        @click="goHome"
      >
        {{ $t("maintenance.backHome") }}
      </button>
      <p class="mt-4 text-xs text-slate-400">
        {{ $t("maintenance.hint") }}
      </p>
    </div>
  </div>
</template>
