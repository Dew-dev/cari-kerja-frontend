/**
 * Display-only thousand separators (comma). Stored/submitted value stays digits-only.
 */
export function maskNumber(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function unmaskNumber(value) {
  return String(value ?? "").replace(/\D/g, "");
}
