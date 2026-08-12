import { getResumeSignedUrl } from "@/services/workers.api";
import { isPrivateStorageKey, resolveUploadUrl } from "@/utils/mediaUrl";

function unwrapSignedPayload(response) {
  const body = response?.data;
  const data = body?.data ?? body;
  if (data?.url) return data.url;
  if (typeof data === "string" && /^https?:\/\//i.test(data)) return data;
  return "";
}

/**
 * Whether resume_url can be opened directly in the browser.
 */
export function isDirectResumeUrl(url) {
  if (!url) return false;
  const raw = String(url).trim();
  if (isPrivateStorageKey(raw)) return false;
  if (/^https?:\/\//i.test(raw)) return true;
  if (raw.includes("/uploads/") || raw.startsWith("uploads/")) return true;
  return false;
}

/**
 * Prefer GET /workers/resumes/:id/signed-url; fall back to resolved resume_url.
 * @param {{ id?: string|number, resume_id?: string|number, resume_url?: string }} resume
 * @returns {Promise<string>}
 */
export async function resolveResumeViewUrl(resume) {
  if (!resume) return "";
  const resumeId = resume.id ?? resume.resume_id ?? null;
  const resumeUrl = resume.resume_url ?? resume.url ?? "";

  if (resumeId) {
    try {
      const response = await getResumeSignedUrl(resumeId);
      const signed = unwrapSignedPayload(response);
      if (signed) return signed;
    } catch (err) {
      // Fall through to direct URL when endpoint fails (legacy / already resolved).
      console.warn("[resume] signed-url failed, falling back:", err?.response?.status || err);
    }
  }

  if (isDirectResumeUrl(resumeUrl)) {
    return resolveUploadUrl(resumeUrl);
  }

  return "";
}

/**
 * Open CV in a new tab via signed URL (with fallback).
 */
export async function openResumeInNewTab(resume) {
  const url = await resolveResumeViewUrl(resume);
  if (!url) {
    const err = new Error("RESUME_URL_UNAVAILABLE");
    err.code = "RESUME_URL_UNAVAILABLE";
    throw err;
  }
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}
