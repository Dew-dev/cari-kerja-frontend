/**
 * Origin that serves static uploads (/uploads/...).
 * Prefers VITE_FILE_STORAGE_URL; falls back to API base origin
 * (strips /api/v1 so we never open https://host/api/v1/uploads/...).
 */
export function getUploadBaseUrl() {
  const candidates = [
    import.meta.env.VITE_FILE_STORAGE_URL,
    import.meta.env.VITE_MINIO_PUBLIC_BASE_URL,
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

/** Storage keys that must go through the signed-url endpoint (not public CDN). */
export function isPrivateStorageKey(path) {
  if (path == null || path === "") return false;
  const raw = String(path).trim();
  return /^s3:/i.test(raw) || /^minio:/i.test(raw);
}

/**
 * Resolve avatar / logo / cover paths to an absolute URL.
 * - http(s) → unchanged (covers MinIO public URLs + signed URLs)
 * - /uploads/... or uploads/... → `${uploadBase}${path}` (legacy local)
 * - s3:/minio: private keys → "" (must use signed-url helper for resumes)
 */
export function resolveUploadUrl(path) {
  if (path == null || path === "") return "";
  const raw = String(path).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (isPrivateStorageKey(raw)) return "";

  const base = getUploadBaseUrl();
  const pathPart = raw.startsWith("/") ? raw : `/${raw}`;
  if (!base) return pathPart;
  return `${base}${pathPart}`;
}
