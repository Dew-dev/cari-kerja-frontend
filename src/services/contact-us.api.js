import api from "./api";

/**
 * POST /contact-us
 * Public endpoint — no auth required.
 * Payload: { name, email, subject, message, phone? }
 */
export async function createContactMessage(payload) {
  const res = await api.post("/contact-us", {
    name: payload.name,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
    phone: payload.phone || null,
    captcha_token: payload.captcha_token || null,
    // Honeypot — selalu kosong; bot yang mengisi akan ditolak BE
    website: payload.website ?? "",
  });
  return res.data;
}
