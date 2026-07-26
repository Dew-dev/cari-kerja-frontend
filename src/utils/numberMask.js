/**
 * Display-only thousand separators (comma). Stored/submitted value stays digits-only.
 * Backend may return decimals like "5000000.00" — drop the fractional part first
 * so unmasking does not turn it into "500000000".
 */
export function unmaskNumber(value) {
  const str = String(value ?? "").trim();
  if (!str) return "";
  // Drop decimal fraction (backend uses "."); keep thousand-sep commas out via \D
  const integerPart = str.split(".")[0];
  return integerPart.replace(/\D/g, "");
}

export function maskNumber(value) {
  const digits = unmaskNumber(value);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Caret index in masked string that sits after `digitCount` digits. */
export function caretPosAfterDigits(masked, digitCount) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < masked.length; i += 1) {
    if (/\d/.test(masked[i])) {
      seen += 1;
      if (seen >= digitCount) return i + 1;
    }
  }
  return masked.length;
}
