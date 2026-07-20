/**
 * Deteksi error terstruktur dari backend (rate limit, CAPTCHA, gate verifikasi).
 * Format pesan mengikuti kontrak backend:
 * - 429  "RATE_LIMITED: ..."
 * - 400  "CAPTCHA_REQUIRED" | "CAPTCHA_INVALID"
 * - 403  "VERIFICATION_REQUIRED: ..."
 */

function responseMessage(err) {
  return String(err?.response?.data?.message || "");
}

export function isRateLimitedError(err) {
  return (
    err?.response?.status === 429 ||
    responseMessage(err).startsWith("RATE_LIMITED:")
  );
}

export function isCaptchaError(err) {
  const message = responseMessage(err);
  return (
    err?.response?.status === 400 &&
    (message === "CAPTCHA_REQUIRED" || message === "CAPTCHA_INVALID")
  );
}

export function isVerificationRequiredError(err) {
  return (
    err?.response?.status === 403 &&
    responseMessage(err).startsWith("VERIFICATION_REQUIRED")
  );
}
