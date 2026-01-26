import api from "../services/api";

export const getWorkerByApplication = (applicationId) => {
  return api.get(`/job-applications/${applicationId}/worker`);
};
