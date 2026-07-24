/**
 * Origin that serves static uploads (/uploads/...).
 * Prefers VITE_FILE_STORAGE_URL; falls back to API base origin
 * (strips /api/v1 so we never open https://host/api/v1/uploads/...).
 */
export function getUploadBaseUrl() {
  const candidates = [
    import.meta.env.VITE_FILE_STORAGE_URL,
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_API_URL,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    try {
      return new URL(String(raw)).origin;
    } catch {
      const cleaned = String(raw)
        .trim()
        .replace(/\/api\/v1\/?$/i, "")
        .replace(/\/$/, "");
      if (cleaned) return cleaned;
    }
  }

  return "";
}

/**
 * Resolve avatar / resume / cover paths to an absolute URL on the API host.
 * - http(s) → unchanged
 * - /uploads/... or uploads/... → `${uploadBase}${path}`
 */
export function resolveUploadUrl(path) {
  if (path == null || path === "") return "";
  const raw = String(path).trim();
  if (/^https?:\/\//i.test(raw)) return raw;

  const base = getUploadBaseUrl();
  const pathPart = raw.startsWith("/") ? raw : `/${raw}`;
  if (!base) return pathPart;
  return `${base}${pathPart}`;
}
