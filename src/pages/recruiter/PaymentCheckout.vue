<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { getAllPlans, createInvoice } from "@/services/payments.api.js";

const route  = useRoute();
const router = useRouter();
const { t }  = useI18n();

const orderType = route.query.type;
const planId    = Number(route.query.plan_id);
const jobPostId = route.query.job_post_id || null;

const plan           = ref(null);
const loading        = ref(true);
const step           = ref(1);
const invoiceLoading = ref(false);

const selectedMethod = ref(null);
const selectedBank   = ref(null);
const card = ref({ name: "", number: "", expiry: "", cvv: "" });
const cardErrors = ref({});

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
const PPN_RATE     = 0.11;
const QRIS_RATE    = 0.007;
const CARD_RATE    = 0.029;
const CARD_FIX_FEE = 2000;

const VA_BANKS = [
  { id: "BCA",     name: "BCA",          fee: 4500 },
  { id: "BNI",     name: "BNI",          fee: 4000 },
  { id: "BRI",     name: "BRI",          fee: 4000 },
  { id: "MANDIRI", name: "Bank Mandiri", fee: 4500 },
  { id: "PERMATA", name: "Permata Bank", fee: 4500 },
  { id: "BSI",     name: "BSI",          fee: 4000 },
];

const subtotal  = computed(() => Number(plan.value?.price_idr ?? 0));
const ppnAmount = computed(() => Math.round(subtotal.value * PPN_RATE));
const baseTotal = computed(() => subtotal.value + ppnAmount.value);

const methodFee = computed(() => {
  if (selectedMethod.value === "qris")
    return Math.round(baseTotal.value * QRIS_RATE);
  if (selectedMethod.value === "va" && selectedBank.value) {
    return Number(VA_BANKS.find((b) => b.id === selectedBank.value)?.fee ?? 0);
  }
  if (selectedMethod.value === "card")
    return Math.round(baseTotal.value * CARD_RATE) + CARD_FIX_FEE;
  return 0;
});
const grandTotal = computed(() => baseTotal.value + methodFee.value);

const selectedBankObj = computed(() => VA_BANKS.find((b) => b.id === selectedBank.value) || null);

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

// ─── Card input helpers ───────────────────────────────────────────────────────
function onCardNumberInput(e) {
  const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
  card.value.number = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
}
function onExpiryInput(e) {
  let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (raw.length > 2) raw = raw.slice(0, 2) + "/" + raw.slice(2);
  card.value.expiry = raw;
}
function onCvvInput(e) { card.value.cvv = e.target.value.replace(/\D/g, "").slice(0, 4); }

function validateCard() {
  const errs = {};
  const num = card.value.number.replace(/\s/g, "");
  if (!card.value.name.trim())                      errs.name   = t("payment.checkout.errors.nameRequired");
  if (num.length < 15)                              errs.number = t("payment.checkout.errors.cardNumberInvalid");
  if (!/^\d{2}\/\d{2}$/.test(card.value.expiry))   errs.expiry = t("payment.checkout.errors.cardExpiryInvalid");
  if (card.value.cvv.length < 3)                    errs.cvv    = t("payment.checkout.errors.cardCvvInvalid");
  cardErrors.value = errs;
  return Object.keys(errs).length === 0;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function goToMethodSelect() {
  step.value = 2;
  selectedMethod.value = null;
  selectedBank.value   = null;
  card.value = { name: "", number: "", expiry: "", cvv: "" };
  cardErrors.value = {};
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function backToDetail() { step.value = 1; }

const canPay = computed(() => {
  if (!selectedMethod.value) return false;
  if (selectedMethod.value === "va" && !selectedBank.value) return false;
  return true;
});

// ─── Create invoice ───────────────────────────────────────────────────────────
async function createBill() {
  if (selectedMethod.value === "card" && !validateCard()) return;
  if (!canPay.value || invoiceLoading.value) return;
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
        @click="step === 1 ? router.back() : backToDetail()"
        class="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm mb-6 transition-colors group"
      >
        <i class="pi pi-arrow-left text-xs group-hover:-translate-x-1 transition-transform"></i>
        {{ step === 1 ? t("payment.checkout.backToPlans") : t("payment.checkout.backToDetails") }}
      </button>

      <!-- Step indicator -->
      <div class="flex items-center gap-2 mb-7">
        <template v-for="(label, i) in [t('payment.checkout.stepPlanDetail'), t('payment.checkout.stepMethod')]" :key="i">
          <div class="flex items-center gap-2">
            <div :class="[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300',
              step > i + 1  ? 'bg-green-500 border-green-500 text-white' :
              step === i + 1 ? 'bg-blue-600 border-blue-600 text-white shadow' :
              'bg-white border-gray-200 text-gray-400',
            ]">
              <i v-if="step > i + 1" class="pi pi-check text-xs"></i>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span :class="['text-sm font-medium', step === i + 1 ? 'text-gray-800' : 'text-gray-400']">{{ label }}</span>
          </div>
          <i v-if="i < 1" class="pi pi-chevron-right text-gray-300 text-xs mx-1"></i>
        </template>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-9 h-9 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="plan">

        <!-- ======================== STEP 1: DETAIL ======================== -->
        <div v-if="step === 1" class="space-y-4">

          <!-- Plan card -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <!-- Colored header -->
            <div :class="`bg-gradient-to-r ${planMeta.gradient} px-6 py-5`">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <i :class="`pi ${planMeta.icon} text-white text-xl`"></i>
                </div>
                <div>
                  <div class="text-white/80 text-xs uppercase tracking-wider font-medium mb-0.5">{{ orderTypeLabel }}</div>
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
                <span class="text-gray-800 font-bold">{{ t("payment.checkout.subtotal") }}</span>
                <span class="text-gray-900 font-extrabold text-lg">{{ formatRupiah(baseTotal) }}</span>
              </div>
            </div>
            <p class="text-gray-400 text-xs mt-4">
              <i class="pi pi-info-circle mr-1"></i>
              {{ t("payment.checkout.feeHint") }}
            </p>
          </div>

          <!-- Continue -->
          <button
            @click="goToMethodSelect"
            :class="`w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r ${planMeta.gradient} hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow`"
          >
            {{ t("payment.checkout.continue") }} <i class="pi pi-arrow-right"></i>
          </button>
        </div>

        <!-- ======================== STEP 2: METHOD ======================== -->
        <div v-else class="space-y-4">

          <!-- Order summary compact -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div :class="`bg-gradient-to-r ${planMeta.gradient} px-5 py-3 flex items-center justify-between`">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <i :class="`pi ${planMeta.icon} text-white text-sm`"></i>
                </div>
                <div>
                  <div class="text-white/70 text-xs">{{ t("payment.checkout.selectedPlan") }}</div>
                  <div class="text-white font-bold text-sm">{{ plan.display_name }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-white/70 text-xs">{{ t("payment.checkout.subtotal") }}</div>
                <div class="text-white font-extrabold">{{ formatRupiah(baseTotal) }}</div>
              </div>
            </div>
          </div>

          <!-- Payment methods -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 class="text-gray-800 font-semibold mb-4 text-sm flex items-center gap-2">
              <i class="pi pi-credit-card text-blue-500"></i> {{ t("payment.checkout.stepMethod") }}
            </h3>

            <div class="space-y-2.5">

              <!-- QRIS -->
              <div
                @click="selectedMethod = 'qris'; selectedBank = null"
                :class="['rounded-xl border-2 cursor-pointer transition-all duration-200', selectedMethod === 'qris' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50']"
              >
                <div class="flex items-center gap-3 p-3.5">
                  <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i class="pi pi-qrcode text-white text-sm"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-800 font-semibold text-sm">QRIS</span>
                      <span class="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded border border-green-200">Instant</span>
                    </div>
                    <div class="text-gray-400 text-xs mt-0.5">{{ t("payment.checkout.qrisDesc") }}</div>
                  </div>
                  <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0', selectedMethod === 'qris' ? 'border-blue-500 bg-blue-500' : 'border-gray-300']">
                    <div v-if="selectedMethod === 'qris'" class="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <Transition name="expand">
                  <div v-if="selectedMethod === 'qris'" class="border-t border-blue-100 px-4 pb-4 pt-3">
                    <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2.5 text-sm">
                      <div class="flex justify-between text-gray-600">
                        <span>{{ t("payment.checkout.subtotal") }}</span>
                        <span>{{ formatRupiah(baseTotal) }}</span>
                      </div>
                      <div class="flex justify-between text-gray-600">
                        <span class="flex items-center gap-1.5">
                          Biaya QRIS
                          <span class="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{{ (QRIS_RATE * 100).toFixed(1) }}% MDR</span>
                        </span>
                        <span class="text-orange-600 font-semibold">+ {{ formatRupiah(methodFee) }}</span>
                      </div>
                      <div class="h-px bg-blue-100"></div>
                      <div class="flex justify-between text-gray-900 font-bold">
                        <span>{{ t("payment.checkout.totalCharged") }}</span>
                        <span class="text-base">{{ formatRupiah(grandTotal) }}</span>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Virtual Account -->
              <div
                @click="selectedMethod = 'va'"
                :class="['rounded-xl border-2 cursor-pointer transition-all duration-200', selectedMethod === 'va' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-200 hover:bg-gray-50']"
              >
                <div class="flex items-center gap-3 p-3.5">
                  <div class="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i class="pi pi-building-columns text-white text-sm"></i>
                  </div>
                  <div class="flex-1">
                    <div class="text-gray-800 font-semibold text-sm">{{ t("payment.checkout.vaTitle") }}</div>
                    <div class="text-gray-400 text-xs mt-0.5">{{ t("payment.checkout.vaDesc") }}</div>
                  </div>
                  <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0', selectedMethod === 'va' ? 'border-green-500 bg-green-500' : 'border-gray-300']">
                    <div v-if="selectedMethod === 'va'" class="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <Transition name="expand">
                  <div v-if="selectedMethod === 'va'" class="border-t border-green-100 px-4 pb-4 pt-3">
                    <p class="text-gray-500 text-xs mb-3">{{ t("payment.checkout.vaSelect") }}</p>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        v-for="bank in VA_BANKS"
                        :key="bank.id"
                        @click.stop="selectedBank = bank.id"
                        :class="[
                          'flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200',
                          selectedBank === bank.id ? 'border-green-400 bg-green-50 shadow-sm' : 'border-gray-200 bg-white hover:border-green-200 hover:bg-gray-50',
                        ]"
                      >
                        <div class="flex items-center justify-between w-full mb-1">
                          <span class="font-bold text-gray-800 text-xs">{{ bank.id }}</span>
                          <div :class="['w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center', selectedBank === bank.id ? 'border-green-500 bg-green-500' : 'border-gray-300']">
                            <div v-if="selectedBank === bank.id" class="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div class="text-gray-400 text-[10px]">{{ bank.name }}</div>
                        <div class="text-orange-500 text-[10px] mt-0.5 font-medium">+{{ formatRupiah(bank.fee) }}</div>
                      </button>
                    </div>
                    <Transition name="expand">
                      <div v-if="selectedBankObj" class="mt-3 bg-green-50 border border-green-100 rounded-xl p-4 space-y-2.5 text-sm">
                        <div class="flex justify-between text-gray-600">
                          <span>{{ t("payment.checkout.subtotal") }}</span>
                          <span>{{ formatRupiah(baseTotal) }}</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                          <span>Biaya admin {{ selectedBankObj.name }}</span>
                          <span class="text-orange-600 font-semibold">+ {{ formatRupiah(selectedBankObj.fee) }}</span>
                        </div>
                        <div class="h-px bg-green-100"></div>
                        <div class="flex justify-between text-gray-900 font-bold">
                          <span>{{ t("payment.checkout.totalCharged") }}</span>
                          <span class="text-base">{{ formatRupiah(grandTotal) }}</span>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </Transition>
              </div>

              <!-- Kartu Kredit/Debit -->
              <div
                @click="selectedMethod = 'card'; selectedBank = null"
                :class="['rounded-xl border-2 transition-all duration-200', selectedMethod === 'card' ? 'border-violet-400 bg-violet-50 cursor-default' : 'border-gray-200 hover:border-violet-200 hover:bg-gray-50 cursor-pointer']"
              >
                <div class="flex items-center gap-3 p-3.5">
                  <div class="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i class="pi pi-credit-card text-white text-sm"></i>
                  </div>
                  <div class="flex-1">
                    <div class="text-gray-800 font-semibold text-sm">{{ t("payment.checkout.cardTitle") }}</div>
                    <div class="text-gray-400 text-xs mt-0.5">{{ t("payment.checkout.cardDesc") }}</div>
                  </div>
                  <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0', selectedMethod === 'card' ? 'border-violet-500 bg-violet-500' : 'border-gray-300']">
                    <div v-if="selectedMethod === 'card'" class="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <Transition name="expand">
                  <div v-if="selectedMethod === 'card'" class="border-t border-violet-100 px-4 pb-5 pt-3" @click.stop>
                    <div class="space-y-3">
                      <!-- Name -->
                      <div>
                        <label class="text-gray-600 text-xs font-medium mb-1.5 block">{{ t("payment.checkout.cardName") }}</label>
                        <input
                          v-model="card.name"
                          type="text"
                          :placeholder="t('payment.checkout.cardNamePlaceholder')"
                          class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all uppercase"
                          style="text-transform: uppercase"
                          @input="cardErrors.name = ''"
                        />
                        <p v-if="cardErrors.name" class="text-red-500 text-xs mt-1">{{ cardErrors.name }}</p>
                      </div>
                      <!-- Card number -->
                      <div>
                        <label class="text-gray-600 text-xs font-medium mb-1.5 block">{{ t("payment.checkout.cardNumber") }}</label>
                        <input
                          :value="card.number"
                          @input="onCardNumberInput"
                          type="text"
                          inputmode="numeric"
                          placeholder="0000 0000 0000 0000"
                          maxlength="19"
                          class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 tracking-widest transition-all"
                          @input.stop="cardErrors.number = ''"
                        />
                        <p v-if="cardErrors.number" class="text-red-500 text-xs mt-1">{{ cardErrors.number }}</p>
                      </div>
                      <!-- Expiry + CVV -->
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="text-gray-600 text-xs font-medium mb-1.5 block">{{ t("payment.checkout.cardExpiry") }}</label>
                          <input
                            :value="card.expiry"
                            @input="onExpiryInput"
                            type="text"
                            inputmode="numeric"
                            placeholder="MM/YY"
                            maxlength="5"
                            class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 tracking-widest transition-all"
                            @input.stop="cardErrors.expiry = ''"
                          />
                          <p v-if="cardErrors.expiry" class="text-red-500 text-xs mt-1">{{ cardErrors.expiry }}</p>
                        </div>
                        <div>
                          <label class="text-gray-600 text-xs font-medium mb-1.5 block">{{ t("payment.checkout.cardCvv") }} <span class="text-gray-300 text-[10px]">{{ t("payment.checkout.cardCvvHint") }}</span></label>
                          <input
                            :value="card.cvv"
                            @input="onCvvInput"
                            type="password"
                            inputmode="numeric"
                            placeholder="•••"
                            maxlength="4"
                            class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 tracking-widest transition-all"
                            @input.stop="cardErrors.cvv = ''"
                          />
                          <p v-if="cardErrors.cvv" class="text-red-500 text-xs mt-1">{{ cardErrors.cvv }}</p>
                        </div>
                      </div>
                      <!-- Card fee breakdown -->
                      <div class="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2.5 text-sm">
                        <div class="flex justify-between text-gray-600">
                          <span>{{ t("payment.checkout.subtotal") }}</span><span>{{ formatRupiah(baseTotal) }}</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                          <span class="flex items-center gap-1.5">
                            Biaya kartu kredit
                            <span class="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{{ (CARD_RATE * 100).toFixed(1) }}% + Rp 2.000</span>
                          </span>
                          <span class="text-orange-600 font-semibold">+ {{ formatRupiah(methodFee) }}</span>
                        </div>
                        <div class="h-px bg-violet-100"></div>
                        <div class="flex justify-between text-gray-900 font-bold">
                          <span>{{ t("payment.checkout.totalCharged") }}</span><span class="text-base">{{ formatRupiah(grandTotal) }}</span>
                        </div>
                      </div>
                      <p class="text-gray-400 text-xs flex items-center gap-1.5">
                        <i class="pi pi-lock text-[11px]"></i>
                        {{ t("payment.checkout.cardSecureHint") }}
                      </p>
                    </div>
                  </div>
                </Transition>
              </div>

            </div><!-- end methods -->
          </div>

          <!-- Grand total -->
          <div v-if="selectedMethod" class="bg-white border border-gray-200 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm">
            <span class="text-gray-500 text-sm">{{ t("payment.checkout.totalCharged") }}</span>
            <span class="text-gray-900 font-extrabold text-xl transition-all duration-300">{{ formatRupiah(grandTotal) }}</span>
          </div>

          <!-- Pay button -->
          <button
            @click="createBill"
            :disabled="!canPay || invoiceLoading"
            :class="[
              'w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow',
              canPay && !invoiceLoading
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

          <p class="text-center text-gray-400 text-xs flex items-center justify-center gap-1.5">
            <i class="pi pi-lock text-[11px]"></i> {{ t("payment.checkout.secureTransaction") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.22s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 700px; }
</style>
