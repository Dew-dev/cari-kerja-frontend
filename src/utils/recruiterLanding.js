import { useEmployerVerificationStore } from "../stores/employerVerificationStore";

/**
 * Setelah login/register recruiter: sync status KYC dan tentukan route home.
 * @returns {Promise<string>} path
 */
export async function resolveRecruiterLandingPath() {
  const store = useEmployerVerificationStore();
  try {
    const status = await store.fetchStatus();
    if (status?.restricted_verification) {
      return "/recruiter/verification";
    }
  } catch {
    // Status gagal — tetap biarkan masuk; guard/interceptor akan mengarahkan jika perlu
  }
  return "/recruiter/jobs";
}
