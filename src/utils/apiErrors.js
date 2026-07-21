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

/**
 * Response SUKSES dengan message "CONTENT_FLAGGED: ..." — job ditahan
 * ke status PENDING untuk review konten (bukan failure).
 * Detail ada di response.data.data.moderation ({ risk_score, flags }).
 */
export function isContentFlaggedResponse(response) {
  return String(response?.data?.message || "").startsWith("CONTENT_FLAGGED");
}

/** Kode error chat terstruktur dari backend (403 ForbiddenError). */
export function getChatErrorCode(err) {
  const message = responseMessage(err);
  if (message.startsWith("CHAT_GATE:")) return "CHAT_GATE";
  if (message.startsWith("CHAT_BLOCKED:")) return "CHAT_BLOCKED";
  if (message.startsWith("CHAT_ARCHIVED:")) return "CHAT_ARCHIVED";
  return null;
}

export function isChatGateError(err) {
  return getChatErrorCode(err) === "CHAT_GATE";
}

export function isChatBlockedError(err) {
  return getChatErrorCode(err) === "CHAT_BLOCKED";
}

export function isChatArchivedError(err) {
  return getChatErrorCode(err) === "CHAT_ARCHIVED";
}

/**
 * Pesan i18n untuk error chat terstruktur. Mengembalikan null jika bukan CHAT_*.
 * @param {unknown} err
 * @param {(key: string) => string} t
 */
export function chatErrorI18nKey(err) {
  const code = getChatErrorCode(err);
  if (code === "CHAT_GATE") return "chat.errors.gate";
  if (code === "CHAT_BLOCKED") return "chat.errors.blocked";
  if (code === "CHAT_ARCHIVED") return "chat.errors.archived";
  return null;
}
