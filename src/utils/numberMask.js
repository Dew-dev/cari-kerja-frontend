/**
 * Display-only thousand separators (comma). Stored/submitted value stays digits-only.
 */
export function unmaskNumber(value) {
  return String(value ?? "").replace(/\D/g, "");
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
