/**
 * Deteksi error terstruktur dari backend (rate limit, CAPTCHA, gate verifikasi).
 * Format pesan mengikuti kontrak backend:
 * - 429  "RATE_LIMITED: ..." (+ data.retry_after_seconds / Retry-After)
 * - 400  "CAPTCHA_REQUIRED" | "CAPTCHA_INVALID"
 * - 403  "VERIFICATION_REQUIRED: ..." | "ACCOUNT_RESTRICTED: ..."
 * - 400  "DUPLICATE_SUBMISSION: ..."
 * - 400  "CONTENT_REJECTED: Message exceeds maximum length ..."
 */

function responseMessage(err) {
  return String(err?.response?.data?.message || "");
}

/**
 * Pesan error dari HTTP axios ATAU payload socket (`{ message }` / Error / string).
 */
export function errorMessage(errOrPayload) {
  if (errOrPayload == null) return "";
  if (typeof errOrPayload === "string") return errOrPayload;
  const fromHttp = errOrPayload?.response?.data?.message;
  if (fromHttp) return String(fromHttp);
  if (errOrPayload?.message != null) return String(errOrPayload.message);
  return "";
}

export function isRateLimitedError(err) {
  return (
    err?.response?.status === 429 ||
    responseMessage(err).startsWith("RATE_LIMITED:") ||
    errorMessage(err).startsWith("RATE_LIMITED:")
  );
}

/**
 * Detik cooldown dari body (`data.retry_after_seconds`) atau header `Retry-After`.
 * @returns {number|null}
 */
export function getRetryAfterSeconds(err) {
  const body = err?.response?.data;
  const nested = body?.data?.retry_after_seconds;
  if (nested != null && Number.isFinite(Number(nested))) {
    return Math.max(0, Number(nested));
  }
  if (body?.retry_after_seconds != null && Number.isFinite(Number(body.retry_after_seconds))) {
    return Math.max(0, Number(body.retry_after_seconds));
  }

  const headers = err?.response?.headers || {};
  const headerVal =
    headers["retry-after"] ??
    headers["Retry-After"] ??
    headers["RETRY-AFTER"];
  if (headerVal != null && Number.isFinite(Number(headerVal))) {
    return Math.max(0, Number(headerVal));
  }

  return null;
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
 * Akun ditangguhkan / dibatasi — biasanya 403 + ACCOUNT_RESTRICTED:.
 * Juga cocok untuk pesan socket connect_error.
 */
export function isAccountRestrictedError(err) {
  const message = errorMessage(err);
  if (message.includes("ACCOUNT_RESTRICTED")) return true;
  if (err?.response?.status === 403 && message.toLowerCase().includes("suspended")) {
    return true;
  }
  return message.toLowerCase().includes("account is suspended");
}

/**
 * Lamaran / submit ganda — treat sebagai already applied.
 */
export function isDuplicateSubmissionError(err) {
  return responseMessage(err).startsWith("DUPLICATE_SUBMISSION");
}

/**
 * Pesan chat terlalu panjang (REST atau socket error payload).
 */
export function isMessageTooLongError(err) {
  const msg = errorMessage(err).toLowerCase();
  return (
    msg.includes("message exceeds") ||
    (msg.startsWith("content_rejected") && msg.includes("maximum length"))
  );
}

/**
 * 400 BadRequest — konten ditolak (email disposable, file tipuan/magic bytes, dll).
 * Message diawali "CONTENT_REJECTED:".
 */
export function isContentRejectedError(err) {
  return (
    err?.response?.status === 400 &&
    responseMessage(err).startsWith("CONTENT_REJECTED")
  );
}

/**
 * Disposable / temporary email rejected at register (or change-email).
 */
export function isDisposableEmailRejected(err) {
  if (!isContentRejectedError(err)) return false;
  const msg = responseMessage(err).toLowerCase();
  // Jangan bentrok dengan "disposable phone number"
  if (msg.includes("phone")) return false;
  return msg.includes("email") || msg.includes("disposable");
}

/**
 * Nomor telepon disposabel / tidak valid pada register recruiter.
 */
export function isDisposablePhoneRejected(err) {
  if (!isContentRejectedError(err)) return false;
  return responseMessage(err).toLowerCase().includes("phone");
}

/**
 * 503 + MAINTENANCE_MODE: — platform sedang maintenance.
 */
export function isMaintenanceModeError(err) {
  return (
    err?.response?.status === 503 &&
    responseMessage(err).startsWith("MAINTENANCE_MODE")
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
