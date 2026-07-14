<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { getActivePlan, getPaymentOrders } from "@/services/payments.api.js";

const router = useRouter();
const route  = useRoute();
const { t }   = useI18n();

const activePlan  = ref(null);
const latestOrder = ref(null);
const loading     = ref(true);

onMounted(async () => {
  try {
    const [planRes, ordersRes] = await Promise.all([
      getActivePlan().catch(() => null),
      getPaymentOrders({ limit: 1 }).catch(() => null),
    ]);
    if (planRes?.data) activePlan.value = planRes.data;
    if (ordersRes?.data && ordersRes.data.length > 0) {
      latestOrder.value = ordersRes.data[0];
    }
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
});

function formatRupiah(amount) {
  if (!amount) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
    <div class="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">

      <!-- Success animation circle -->
      <div class="relative mb-6 flex justify-center">
        <div class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <div class="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shadow-md">
              <i class="pi pi-check text-xl text-white font-bold"></i>
            </div>
          </div>
        </div>
        <!-- Sparkles -->
        <div class="absolute top-0 right-14 text-yellow-400 text-lg animate-bounce" style="animation-delay: 0.1s">✨</div>
        <div class="absolute bottom-2 left-12 text-green-400 text-base animate-bounce" style="animation-delay: 0.3s">⭐</div>
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-extrabold text-gray-900 mb-2">
        {{ t("payment.success.title") }}
      </h1>
      <p class="text-gray-500 text-sm mb-6">
        {{ t("payment.success.desc") }}
      </p>

      <!-- Loading indicator -->
      <div v-if="loading" class="flex justify-center mb-6">
        <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="space-y-4 mb-6 text-left">
        <!-- Amount Paid -->
        <div v-if="latestOrder" class="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
          <div>
            <div class="text-gray-400 text-xs font-medium">{{ t("payment.success.amountPaid") }}</div>
            <div class="text-gray-900 text-base font-bold mt-0.5">{{ latestOrder.metadata?.plan_display_name || "-" }}</div>
          </div>
          <div class="text-right">
            <div class="text-green-600 font-extrabold text-lg">{{ formatRupiah(latestOrder.amount) }}</div>
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full mt-0.5">
              <i class="pi pi-check text-[8px]"></i> {{ t("payment.orders.status.paid") }}
            </span>
          </div>
        </div>

        <!-- Active Plan Card -->
        <div v-if="activePlan?.subscription" class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="pi pi-check-circle text-blue-600 text-base"></i>
            </div>
            <div>
              <div class="text-gray-400 text-[10px] font-medium">{{ t("payment.success.currentPlan") }}</div>
              <div class="text-gray-800 font-bold text-sm capitalize">{{ activePlan.subscription.plan_display_name }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-gray-50 border border-gray-100 rounded-lg p-2.5">
              <div class="text-gray-400 text-[10px] mb-0.5">{{ t("payment.success.maxPosts") }}</div>
              <div class="text-gray-800 font-bold text-sm">{{ activePlan.max_active_posts }}</div>
            </div>
            <div class="bg-gray-50 border border-gray-100 rounded-lg p-2.5">
              <div class="text-gray-400 text-[10px] mb-0.5">{{ t("payment.success.expiresAt") }}</div>
              <div class="text-gray-800 font-semibold text-[11px]">
                {{ new Date(activePlan.subscription.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Info if no active subscription (single post or boost) -->
        <div v-else class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <i class="pi pi-info-circle text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
          <p class="text-blue-700 text-xs leading-relaxed">
            {{ t("payment.success.activeProcess") }}
          </p>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="flex flex-col gap-2">
        <router-link
          to="/recruiter/jobs"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <i class="pi pi-briefcase text-xs"></i> {{ t("payment.success.manageJobs") }}
        </router-link>
        <router-link
          to="/recruiter/orders"
          class="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <i class="pi pi-history text-xs"></i> {{ t("payment.success.history") }}
        </router-link>
      </div>
    </div>
  </div>
</template>
