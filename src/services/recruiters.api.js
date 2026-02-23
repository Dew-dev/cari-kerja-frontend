import api from "./api";

export const getRecruitersGroupedByIndustry = async (params = {}) => {
  try {
    const response = await api.get("/recruiters/grouped-by-industry", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching recruiters grouped by industry:", error);
    throw error;
  }
};
