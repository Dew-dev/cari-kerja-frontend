import api from "./api";

export async function saveJob(jobId) {
  const res = await api.post(
    `/saved-jobs/${jobId}`,
    {},
    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
  );
  return res.data;
}

export async function removeSavedJob(jobId) {
  const res = await api.delete(`/saved-jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

export async function getSavedJobs(params = {}) {
  const res = await api.get(`/workers/saved-jobs/self`, {
    params: {
      page: 1,
      limit: 100,
      ...params,
    },
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

export async function checkIfJobSaved(jobId) {
  try {
    const res = await api.get(
      `/saved-jobs/${jobId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    return res.data;
  } catch (error) {
    return false;
  }
}
