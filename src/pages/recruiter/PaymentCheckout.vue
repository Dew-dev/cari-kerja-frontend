<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { getAllPlans, createInvoice } from "@/services/payments.api.js";
import { isRateLimitedError } from "@/utils/apiErrors";

const route  = useRoute();
const router = useRouter();
const { t }  = useI18n();

const orderType = route.query.type;
const planId    = Number(route.query.plan_id);
const jobPostId = route.query.job_post_id || null;

const plan           = ref(null);
const loading        = ref(true);
const invoiceLoading = ref(false);

onMounted(async () => {
  if (!orderType || !planId) {
    push.error(t("payment.checkout.errors.invalidParams"));
    router.replace("/recruiter/pricing");
    return;
  }
  try {
    const res = await getAllPlans(orderType);
    let list = [];
    if (orderType === "subscription")  list = res?.data?.subscription || [];
    else if (orderType === "single_post") list = res?.data?.single_post || [];
    else if (orderType === "boost")    list = res?.data?.boost || [];
    plan.value = list.find((p) => p.id === planId) || null;
    if (!plan.value) {
      push.error(t("payment.checkout.errors.planNotFound"));
      router.replace("/recruiter/pricing");
    }
  } catch {
    push.error(t("payment.checkout.errors.fetchFailed"));
    router.replace("/recruiter/pricing");
  } finally {
    loading.value = false;
  }
});

// ─── Pricing ─────────────────────────────────────────────────────────────────
const PPN_RATE  = 0.11;
const subtotal  = computed(() => Number(plan.value?.price_idr ?? 0));
const ppnAmount = computed(() => Math.round(subtotal.value * PPN_RATE));
const grandTotal = computed(() => subtotal.value + ppnAmount.value);

function formatRupiah(n) {
  if (n === 0) return t("payment.priceFormat.free");
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(Number(n));
}

// ─── Plan visual meta ─────────────────────────────────────────────────────────
const SUB_META = {
  starter:  { gradient: "from-blue-500 to-blue-700",    icon: "pi-bolt" },
  pro:      { gradient: "from-violet-500 to-violet-700", icon: "pi-crown" },
  business: { gradient: "from-amber-500 to-orange-600", icon: "pi-briefcase" },
  free:     { gradient: "from-slate-400 to-slate-600",  icon: "pi-gift" },
};
const planMeta = computed(() => {
  if (!plan.value) return { gradient: "from-slate-400 to-slate-600", icon: "pi-circle" };
  if (orderType === "single_post")
    return plan.value.is_hot
      ? { gradient: "from-orange-500 to-red-600", icon: "pi-fire" }
      : { gradient: "from-blue-500 to-blue-700",  icon: "pi-file-edit" };
  if (orderType === "boost")
    return plan.value.boost_priority === 1
      ? { gradient: "from-amber-400 to-orange-500", icon: "pi-star-fill" }
      : { gradient: "from-blue-500 to-blue-700",    icon: "pi-chart-line" };
  return SUB_META[plan.value.name?.toLowerCase()] || SUB_META.starter;
});

const planFeatures = computed(() => {
  if (!plan.value) return [];
  if (orderType === "subscription")
    return [`${plan.value.max_active_posts} ${t("payment.features.activePosts")}`, t("payment.features.durationDays", { days: plan.value.duration_days }), t("payment.features.secureXendit")];
  if (orderType === "single_post") {
    const f = ["1 slot iklan pekerjaan", t("payment.features.durationDays", { days: plan.value.duration_days }), "Tanpa perlu berlangganan"];
    if (plan.value.is_hot) f.push("Tampil sebagai iklan HOT 🔥");
    return f;
  }
  if (orderType === "boost") {
    const label = plan.value.boost_priority === 1 ? "Posisi paling atas dari semua iklan" : "Masuk 10 iklan teratas setiap hari";
    return [label, t("payment.features.durationDays", { days: plan.value.duration_days }), "Aktif otomatis setelah pembayaran"];
  }
  return [];
});

const orderTypeLabel = computed(() => {
  if (orderType === "subscription")  return t("payment.orders.types.subscription");
  if (orderType === "single_post")   return t("payment.orders.types.singlePost");
  if (orderType === "boost") return plan.value?.boost_priority === 1 ? t("payment.boostModal.hot") : t("payment.boostModal.top10");
  return "Paket";
});

// ─── Create invoice ───────────────────────────────────────────────────────────
async function createBill() {
  if (invoiceLoading.value) return;
  invoiceLoading.value = true;
  try {
    const payload = { order_type: orderType, plan_id: planId };
    if (orderType === "boost" && jobPostId) payload.job_post_id = jobPostId;
    const res = await createInvoice(payload);
    if (res?.data?.payment_url) {
      window.open(res.data.payment_url, "_blank");
      push.success("Tagihan berhasil dibuat! Selesaikan pembayaran di halaman Xendit.");
      router.push("/recruiter/orders");
    } else {
      push.error("Gagal membuat tagihan. Silakan coba lagi.");
    }
  } catch (err) {
    if (isRateLimitedError(err)) {
      const message = String(err?.response?.data?.message || "");
      // Pending-cap: terlalu banyak invoice pending → arahkan ke daftar order
      if (message.toLowerCase().includes("pending")) {
        push.warning(t("payment.checkout.pendingCap"));
        router.push("/recruiter/orders");
      } else {
        push.warning(t("captcha.rateLimited"));
      }
      return;
    }
    push.error(err?.response?.data?.message || "Gagal membuat tagihan pembayaran");
  } finally {
    invoiceLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-10 px-4">
    <div class="max-w-xl mx-auto">

      <!-- Back button -->
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm mb-6 transition-colors group"
      >
        <i class="pi pi-arrow-left text-xs group-hover:-translate-x-1 transition-transform"></i>
        {{ t("payment.checkout.backToPlans") }}
      </button>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-9 h-9 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="plan" class="space-y-4">
        <!-- Plan card -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <!-- Colored header -->
          <div :class="`bg-gradient-to-r ${planMeta.gradient} px-6 py-5`">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i :class="`pi ${planMeta.icon} text-white text-xl`"></i>
              </div>
              <div>
                <div class="text-white/85 text-xs uppercase tracking-wider font-medium mb-0.5">{{ orderTypeLabel }}</div>
                <h2 class="text-xl font-extrabold text-white">{{ plan.display_name }}</h2>
              </div>
            </div>
          </div>
          <!-- Features -->
          <div class="px-6 py-5">
            <ul class="space-y-3">
              <li v-for="f in planFeatures" :key="f" class="flex items-center gap-3 text-sm text-gray-600">
                <span class="w-6 h-6 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-check text-green-600 text-[10px]"></i>
                </span>
                {{ f }}
              </li>
              <li class="flex items-center gap-3 text-sm text-gray-600">
                <span class="w-6 h-6 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-shield text-blue-600 text-[10px]"></i>
                </span>
                {{ t("payment.features.secureXendit") }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Price breakdown -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 class="text-gray-800 font-semibold mb-4 flex items-center gap-2 text-sm">
            <i class="pi pi-receipt text-blue-500"></i> {{ t("payment.checkout.priceDetails") }}
          </h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">{{ t("payment.checkout.planPrice") }}</span>
              <span class="text-gray-800 font-medium">{{ formatRupiah(subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ t("payment.checkout.ppn") }} ({{ (PPN_RATE * 100).toFixed(0) }}%)</span>
              <span class="text-gray-800 font-medium">{{ formatRupiah(ppnAmount) }}</span>
            </div>
            <div class="h-px bg-gray-100"></div>
            <div class="flex justify-between items-center">
              <span class="text-gray-850 font-bold">{{ t("payment.checkout.totalCharged") }}</span>
              <span class="text-gray-900 font-extrabold text-lg">{{ formatRupiah(grandTotal) }}</span>
            </div>
          </div>
          <p class="text-gray-405 text-[11px] mt-4 flex items-center gap-1.5">
            <i class="pi pi-info-circle"></i>
            {{ t("payment.checkout.vatHint") }}
          </p>
        </div>

        <!-- Pay button -->
        <button
          @click="createBill"
          :disabled="invoiceLoading"
          :class="[
            'w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow',
            !invoiceLoading
              ? `bg-gradient-to-r ${planMeta.gradient} text-white hover:shadow-xl hover:scale-[1.01] active:scale-95`
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ]"
        >
          <span v-if="invoiceLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <template v-else>
            <i class="pi pi-file-check"></i>
            <span>{{ t("payment.checkout.payButton") }}</span>
          </template>
        </button>

        <p class="text-center text-gray-400 text-[11px] flex items-center justify-center gap-1.5 mt-2">
          <i class="pi pi-lock"></i> {{ t("payment.checkout.secureTransaction") }}
        </p>
      </div>
    </div>
  </div>
</template>
