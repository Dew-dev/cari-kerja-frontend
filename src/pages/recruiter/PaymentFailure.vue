<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getPaymentOrders } from "@/services/payments.api.js";

const router = useRouter();
const { t }  = useI18n();

const latestOrder = ref(null);
const loading     = ref(true);

onMounted(async () => {
  try {
    const res = await getPaymentOrders({ limit: 1 });
    if (res?.data && res.data.length > 0) {
      latestOrder.value = res.data[0];
    }
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
    <div class="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">

      <!-- Failure Icon Circle -->
      <div class="relative mb-6 flex justify-center">
        <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <div class="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center shadow-md">
              <i class="pi pi-times text-xl text-white font-bold"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-extrabold text-gray-900 mb-2">
        {{ t("payment.failure.title") }}
      </h1>
      <p class="text-gray-500 text-sm mb-6">
        {{ t("payment.failure.desc") }}
      </p>

      <!-- Reason/Error Detail -->
      <div class="bg-gray-50 border border-gray-150 rounded-xl p-4 text-left mb-6">
        <div class="text-gray-700 font-semibold text-xs uppercase tracking-wider mb-1">
          {{ t("payment.failure.reason") }}
        </div>
        <p class="text-gray-500 text-xs leading-relaxed">
          {{ t("payment.failure.reasonDesc") }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-2">
        <router-link
          to="/recruiter/pricing"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow shadow-blue-500/10 hover:shadow-lg flex items-center justify-center gap-2"
        >
          <i class="pi pi-refresh text-xs"></i> {{ t("payment.failure.tryAgain") }}
        </router-link>
        <router-link
          to="/recruiter/pricing"
          class="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <i class="pi pi-arrow-left text-xs"></i> {{ t("payment.failure.backPricing") }}
        </router-link>
      </div>

      <p class="text-center text-gray-400 text-xs mt-6">
        <i class="pi pi-question-circle mr-1"></i>
        Butuh bantuan?
        <router-link to="/contact" class="text-blue-600 hover:underline font-medium">
          {{ t("payment.failure.support") }}
        </router-link>
      </p>
    </div>
  </div>
</template>
