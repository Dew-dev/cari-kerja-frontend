import api from "./api";

export function getEmployerVerificationStatus() {
  return api.get("/employer-verification/status");
}

export function getEmployerVerificationDocTypes() {
  return api.get("/employer-verification/doc-types");
}

export function upsertEmployerVerificationApplication(payload) {
  return api.put("/employer-verification/application", {
    company_legal_name: payload.company_legal_name,
    npwp_number: payload.npwp_number,
    nib_number: payload.nib_number,
    applicant_notes: payload.applicant_notes || null,
  });
}

/**
 * Upload satu dokumen KYC.
 * Field file harus bernama `document`; `doc_type` di body multipart.
 */
export function uploadEmployerVerificationDocument(docType, file) {
  const fd = new FormData();
  fd.append("document", file);
  fd.append("doc_type", docType);
  return api.post("/employer-verification/documents", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function deleteEmployerVerificationDocument(docType) {
  return api.delete(`/employer-verification/documents/${docType}`);
}

export function submitEmployerVerificationApplication() {
  return api.post("/employer-verification/submit");
}

export function requestEmployerReactivation(reason) {
  return api.post("/employer-verification/reactivate", {
    reason: reason || null,
  });
}
