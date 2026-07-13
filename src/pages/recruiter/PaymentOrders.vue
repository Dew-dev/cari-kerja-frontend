<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { push } from "notivue";
import { getPaymentOrders } from "@/services/payments.api.js";

const router = useRouter();

// ─── State ───────────────────────────────────────────────────────────────────
const orders = ref([]);
const loading = ref(true);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const filterStatus = ref("");
const filterType = ref("");
const currentPage = ref(1);

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchOrders() {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: meta.value.limit,
    };
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterType.value) params.order_type = filterType.value;

    const res = await getPaymentOrders(params);
    orders.value = res?.data || [];
    if (res?.meta) meta.value = res.meta;
  } catch (err) {
    push.error("Gagal memuat riwayat transaksi");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchOrders);
watch([filterStatus, filterType], () => {
  currentPage.value = 1;
  fetchOrders();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const statusMeta = {
  pending:  { label: "Menunggu Bayar", cls: "bg-yellow-100 text-yellow-700",  icon: "pi-clock" },
  paid:     { label: "Lunas",          cls: "bg-green-100 text-green-700",    icon: "pi-check-circle" },
  expired:  { label: "Kadaluarsa",     cls: "bg-gray-100 text-gray-500",      icon: "pi-times-circle" },
  failed:   { label: "Gagal",          cls: "bg-red-100 text-red-600",        icon: "pi-exclamation-circle" },
};

const typeMeta = {
  subscription: { label: "Langganan",    icon: "pi-calendar",    cls: "text-violet-600 bg-violet-50" },
  single_post:  { label: "Iklan Satuan", icon: "pi-file-edit",   cls: "text-blue-600 bg-blue-50" },
  boost:        { label: "Boost",        icon: "pi-chart-line",  cls: "text-orange-600 bg-orange-50" },
};

function prevPage() {
  if (currentPage.value > 1) { currentPage.value--; fetchOrders(); }
}
function nextPage() {
  if (currentPage.value < meta.value.totalPages) { currentPage.value++; fetchOrders(); }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-10 px-4">
    <div class="max-w-5xl mx-auto">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <button @click="router.back()" class="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2 transition-colors">
            <i class="pi pi-arrow-left text-xs"></i> Kembali
          </button>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <i class="pi pi-history text-blue-600"></i>
            Riwayat Transaksi
          </h1>
          <p class="text-sm text-gray-500 mt-1">Semua riwayat pembayaran akun Anda</p>
        </div>
        <router-link
          to="/recruiter/pricing"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          <i class="pi pi-plus"></i> Beli Paket
        </router-link>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-6">
        <select
          v-model="filterStatus"
          class="text-sm px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu Bayar</option>
          <option value="paid">Lunas</option>
          <option value="expired">Kadaluarsa</option>
          <option value="failed">Gagal</option>
        </select>

        <select
          v-model="filterType"
          class="text-sm px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
        >
          <option value="">Semua Tipe</option>
          <option value="subscription">Langganan</option>
          <option value="single_post">Iklan Satuan</option>
          <option value="boost">Boost</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <div class="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!orders.length"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center"
      >
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-inbox text-2xl text-gray-400"></i>
        </div>
        <h3 class="text-gray-700 font-semibold mb-1">Belum ada transaksi</h3>
        <p class="text-gray-400 text-sm mb-6">Mulai dengan membeli paket untuk meningkatkan rekrutmen Anda.</p>
        <router-link
          to="/recruiter/pricing"
          class="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <i class="pi pi-star"></i> Lihat Paket
        </router-link>
      </div>

      <!-- Orders Table -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="text-left px-5 py-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Tanggal</th>
                <th class="text-left px-5 py-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Tipe</th>
                <th class="text-left px-5 py-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Paket</th>
                <th class="text-left px-5 py-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Jumlah</th>
                <th class="text-left px-5 py-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Status</th>
                <th class="text-left px-5 py-4 text-gray-500 font-semibold text-xs uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="order in orders"
                :key="order.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-5 py-4 text-gray-600 whitespace-nowrap">{{ formatDate(order.created_at) }}</td>
                <td class="px-5 py-4">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold', typeMeta[order.order_type]?.cls || 'bg-gray-100 text-gray-600']">
                    <i :class="`pi ${typeMeta[order.order_type]?.icon || 'pi-circle'} text-xs`"></i>
                    {{ typeMeta[order.order_type]?.label || order.order_type }}
                  </span>
                </td>
                <td class="px-5 py-4 text-gray-700 font-medium">{{ order.metadata?.plan_display_name || "-" }}</td>
                <td class="px-5 py-4 text-gray-900 font-semibold">{{ formatRupiah(order.amount) }}</td>
                <td class="px-5 py-4">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold', statusMeta[order.status]?.cls || 'bg-gray-100 text-gray-500']">
                    <i :class="`pi ${statusMeta[order.status]?.icon || 'pi-circle'} text-xs`"></i>
                    {{ statusMeta[order.status]?.label || order.status }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <a
                    v-if="order.status === 'pending' && order.metadata?.xendit_invoice_url"
                    :href="order.metadata.xendit_invoice_url"
                    target="_blank"
                    class="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                  >
                    <i class="pi pi-external-link text-xs"></i> Bayar
                  </a>
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden divide-y divide-gray-100">
          <div v-for="order in orders" :key="order.id" class="p-4">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div>
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold', typeMeta[order.order_type]?.cls]">
                  <i :class="`pi ${typeMeta[order.order_type]?.icon} text-xs`"></i>
                  {{ typeMeta[order.order_type]?.label }}
                </span>
                <div class="font-semibold text-gray-800 mt-1">{{ order.metadata?.plan_display_name || "-" }}</div>
              </div>
              <span :class="['px-2.5 py-1 rounded-lg text-xs font-semibold', statusMeta[order.status]?.cls]">
                {{ statusMeta[order.status]?.label }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <div class="text-gray-900 font-bold">{{ formatRupiah(order.amount) }}</div>
              <div class="text-gray-400 text-xs">{{ formatDate(order.created_at) }}</div>
            </div>
            <a
              v-if="order.status === 'pending' && order.metadata?.xendit_invoice_url"
              :href="order.metadata.xendit_invoice_url"
              target="_blank"
              class="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 font-semibold"
            >
              <i class="pi pi-external-link text-xs"></i> Selesaikan Pembayaran
            </a>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-5 py-4 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ meta.total }} transaksi total</span>
          <div class="flex items-center gap-2">
            <button
              @click="prevPage"
              :disabled="currentPage <= 1"
              class="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i class="pi pi-chevron-left text-xs"></i>
            </button>
            <span class="text-gray-700 font-medium">{{ currentPage }} / {{ meta.totalPages }}</span>
            <button
              @click="nextPage"
              :disabled="currentPage >= meta.totalPages"
              class="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i class="pi pi-chevron-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
