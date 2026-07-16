import api from "./api";

/**
 * GET /api/v1/payments/plans
 * Ambil semua paket (subscription, single_post, boost)
 * @param {string} [type] - optional: 'subscription' | 'single_post' | 'boost'
 */
export const getAllPlans = async (type = null) => {
  try {
    const params = type ? { type } : {};
    const response = await api.get("/payments/plans", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }
};

/**
 * POST /api/v1/payments/create-invoice
 * Buat invoice Xendit untuk pembayaran
 * @param {Object} payload
 * @param {string} payload.order_type - 'subscription' | 'single_post' | 'boost'
 * @param {number} payload.plan_id - ID paket yang dipilih
 * @param {string} [payload.job_post_id] - wajib jika order_type = 'boost'
 */
export const createInvoice = async (payload) => {
  try {
    const response = await api.post("/payments/create-invoice", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

/**
 * GET /api/v1/payments/orders
 * Riwayat transaksi recruiter (dengan pagination & filter)
 * @param {Object} params
 * @param {string} [params.status] - 'pending' | 'paid' | 'expired' | 'failed'
 * @param {string} [params.order_type] - 'subscription' | 'single_post' | 'boost'
 * @param {number} [params.page]
 * @param {number} [params.limit]
 */
export const getPaymentOrders = async (params = {}) => {
  try {
    const response = await api.get("/payments/orders", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching payment orders:", error);
    throw error;
  }
};

/**
 * GET /api/v1/payments/orders/:id
 * Detail satu transaksi
 * @param {string} id - Order UUID
 */
export const getOrderDetail = async (id) => {
  try {
    const response = await api.get(`/payments/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching order detail:", error);
    throw error;
  }
};

/**
 * GET /api/v1/payments/active-plan
 * Cek paket aktif recruiter (subscription + slot satuan tersedia)
 */
export const getActivePlan = async () => {
  try {
    const response = await api.get("/payments/active-plan");
    return response.data;
  } catch (error) {
    console.error("Error fetching active plan:", error);
    throw error;
  }
};

/**
 * POST /api/v1/payments/single-post/apply
 * Terapkan slot satuan ke job post tertentu
 * @param {Object} payload
 * @param {string} payload.single_post_slot_id - ID slot satuan yang akan digunakan
 * @param {string} payload.job_post_id - ID job post target
 */
export const applySinglePostToJob = async (payload) => {
  try {
    const response = await api.post("/payments/single-post/apply", payload);
    return response.data;
  } catch (error) {
    console.error("Error applying single post slot:", error);
    throw error;
  }
};
