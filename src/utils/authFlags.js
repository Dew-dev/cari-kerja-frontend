const TELEGRAM_PLACEHOLDER_EMAIL_RE = /^telegram_.+@carikerja\.id$/i;

export function isTelegramPlaceholderEmail(email) {
  return typeof email === "string" && TELEGRAM_PLACEHOLDER_EMAIL_RE.test(email);
}

export function displayEmail(email) {
  if (!email || isTelegramPlaceholderEmail(email)) return "";
  return email;
}

export function isFlagTruthy(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}
