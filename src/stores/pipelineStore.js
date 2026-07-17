import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getPipelineCandidates,
  getPipelineAnalytics,
  getRecruiterJobPosts,
  getJobStages,
  createJobStage,
  updateJobStage,
  reorderJobStages,
  deleteJobStage,
  moveApplicationStage,
} from "@/services/pipeline.api";
import { CANONICAL_STAGE_TYPES } from "@/constants/pipeline";

function sortStages(stages) {
  // Rejected (or any stage explicitly flagged) always rendered last,
  // everything else follows its own `position`.
  const isRejected = (s) => s.stage_type === "rejected";
  return [...stages].sort((a, b) => {
    if (isRejected(a) !== isRejected(b)) return isRejected(a) ? 1 : -1;
    return (a.position ?? 0) - (b.position ?? 0);
  });
}

export const usePipelineStore = defineStore("pipeline", () => {
  // ── State ──────────────────────────────────────────────────────────────
  const jobPosts = ref([]);
  const loadingJobPosts = ref(false);

  const selectedJobPostIds = ref([]); // empty => global (all jobs)
  const search = ref("");
  const stageTypeFilter = ref(null);

  const candidates = ref([]);
  const loadingCandidates = ref(false);
  const candidatesError = ref(null);

  const stagesByJobPost = ref({}); // { [jobPostId]: Stage[] }
  const loadingStages = ref({}); // { [jobPostId]: boolean }
  const stagesError = ref(null);

  const analytics = ref({ stage_counts: [], conversion_rates: [] });
  const loadingAnalytics = ref(false);

  const movingApplicationIds = ref(new Set());

  // ── Getters ────────────────────────────────────────────────────────────
  const isSingleJobMode = computed(() => selectedJobPostIds.value.length === 1);
  const activeJobPostId = computed(() => (isSingleJobMode.value ? selectedJobPostIds.value[0] : null));

  const activeJobStages = computed(() => {
    if (!isSingleJobMode.value) return [];
    return sortStages(stagesByJobPost.value[activeJobPostId.value] || []);
  });

  // Columns rendered on the board — either the canonical cross-job
  // categories (global mode) or the real, custom stages of the single
  // selected job post (per-job mode).
  const boardColumns = computed(() => {
    if (isSingleJobMode.value) {
      return activeJobStages.value.map((stage) => ({
        key: String(stage.id),
        id: stage.id,
        name: stage.name,
        stage_type: stage.stage_type,
        color: stage.color,
        is_system: !!stage.is_system,
        isVirtual: false,
      }));
    }

    return CANONICAL_STAGE_TYPES.map((meta) => ({
      key: meta.type,
      id: null,
      name: null,
      stage_type: meta.type,
      i18nKey: meta.i18nKey,
      color: meta.color,
      is_system: true,
      isVirtual: true,
    }));
  });

  const filteredCandidates = computed(() => {
    const query = search.value.trim().toLowerCase();
    if (!query) return candidates.value;
    return candidates.value.filter((c) => (c.name || "").toLowerCase().includes(query));
  });

  const candidatesByColumn = computed(() => {
    const map = {};
    for (const col of boardColumns.value) map[col.key] = [];

    for (const candidate of filteredCandidates.value) {
      const key = isSingleJobMode.value ? String(candidate.stage_id) : candidate.stage_type;
      if (!map[key]) map[key] = [];
      map[key].push(candidate);
    }
    return map;
  });

  const stageCountsMap = computed(() => {
    const map = {};
    for (const row of analytics.value?.stage_counts || []) {
      const key = isSingleJobMode.value ? String(row.stage_id) : row.stage_type;
      map[key] = (map[key] || 0) + row.count;
    }
    return map;
  });

  const isMoving = computed(() => (applicationId) => movingApplicationIds.value.has(applicationId));

  // ── Actions ────────────────────────────────────────────────────────────
  async function fetchJobPosts() {
    try {
      loadingJobPosts.value = true;
      const res = await getRecruiterJobPosts({ limit: 100 });
      jobPosts.value = res.data?.data || [];
    } catch (err) {
      console.error("[Pipeline] Failed to fetch job posts:", err);
    } finally {
      loadingJobPosts.value = false;
    }
  }

  async function fetchStagesForJobPost(jobPostId, { force = false } = {}) {
    if (!jobPostId) return [];
    if (!force && stagesByJobPost.value[jobPostId]) return stagesByJobPost.value[jobPostId];

    try {
      loadingStages.value = { ...loadingStages.value, [jobPostId]: true };
      const res = await getJobStages(jobPostId);
      const stages = res.data?.data || [];
      stagesByJobPost.value = { ...stagesByJobPost.value, [jobPostId]: stages };
      return stages;
    } catch (err) {
      console.error("[Pipeline] Failed to fetch stages for job post:", jobPostId, err);
      stagesError.value = err;
      return stagesByJobPost.value[jobPostId] || [];
    } finally {
      loadingStages.value = { ...loadingStages.value, [jobPostId]: false };
    }
  }

  function buildFilterParams() {
    const params = {};
    if (selectedJobPostIds.value.length) params.job_post_id = selectedJobPostIds.value.join(",");
    if (search.value.trim()) params.search = search.value.trim();
    if (stageTypeFilter.value) params.stage_type = stageTypeFilter.value;
    return params;
  }

  async function fetchCandidates() {
    try {
      loadingCandidates.value = true;
      candidatesError.value = null;
      const params = { ...buildFilterParams(), limit: 500 };
      const res = await getPipelineCandidates(params);
      candidates.value = res.data?.data || [];

      // Warm the stage cache for every job post present in the result set —
      // needed to resolve drag & drop targets in global (cross-job) mode.
      const uniqueJobPostIds = [...new Set(candidates.value.map((c) => c.job_post_id).filter(Boolean))];
      await Promise.all(uniqueJobPostIds.map((id) => fetchStagesForJobPost(id)));

      if (isSingleJobMode.value) {
        await fetchStagesForJobPost(activeJobPostId.value);
      }
    } catch (err) {
      console.error("[Pipeline] Failed to fetch candidates:", err);
      candidatesError.value = err;
    } finally {
      loadingCandidates.value = false;
    }
  }

  async function fetchAnalytics() {
    try {
      loadingAnalytics.value = true;
      const res = await getPipelineAnalytics(buildFilterParams());
      analytics.value = res.data?.data || { stage_counts: [], conversion_rates: [] };
    } catch (err) {
      console.error("[Pipeline] Failed to fetch analytics:", err);
    } finally {
      loadingAnalytics.value = false;
    }
  }

  async function refreshBoard() {
    await Promise.all([fetchCandidates(), fetchAnalytics()]);
  }

  function resolveTargetStageId(candidate, column) {
    if (!column.isVirtual) return column.id;

    // Global mode: find the equivalent stage (by stage_type) within the
    // candidate's own job post pipeline.
    const jobStages = stagesByJobPost.value[candidate.job_post_id] || [];
    const match = jobStages.find((s) => s.stage_type === column.stage_type);
    return match ? match.id : null;
  }

  async function moveCandidate(candidate, column) {
    const targetStageId = resolveTargetStageId(candidate, column);
    if (!targetStageId || targetStageId === candidate.stage_id) return;

    const previous = {
      stage_id: candidate.stage_id,
      stage_name: candidate.stage_name,
      stage_type: candidate.stage_type,
    };

    // Optimistic update
    candidate.stage_id = targetStageId;
    candidate.stage_type = column.stage_type;
    if (!column.isVirtual) candidate.stage_name = column.name;

    movingApplicationIds.value.add(candidate.application_id);
    try {
      await moveApplicationStage(candidate.application_id, targetStageId);
      fetchAnalytics(); // refresh counts/conversion rate in the background
    } catch (err) {
      console.error("[Pipeline] Failed to move candidate:", err);
      candidate.stage_id = previous.stage_id;
      candidate.stage_name = previous.stage_name;
      candidate.stage_type = previous.stage_type;
      throw err;
    } finally {
      movingApplicationIds.value.delete(candidate.application_id);
    }
  }

  async function createStage(jobPostId, payload) {
    const res = await createJobStage(jobPostId, payload);
    await fetchStagesForJobPost(jobPostId, { force: true });
    return res.data?.data;
  }

  async function renameStage(jobPostId, stageId, payload) {
    const res = await updateJobStage(jobPostId, stageId, payload);
    await fetchStagesForJobPost(jobPostId, { force: true });
    return res.data?.data;
  }

  async function persistStageOrder(jobPostId, orderedStages) {
    // Optimistic reorder in cache before the request resolves.
    stagesByJobPost.value = { ...stagesByJobPost.value, [jobPostId]: orderedStages };
    await reorderJobStages(
      jobPostId,
      orderedStages.map((s, index) => ({ id: s.id, position: index })),
    );
    await fetchStagesForJobPost(jobPostId, { force: true });
  }

  async function removeStage(jobPostId, stageId) {
    await deleteJobStage(jobPostId, stageId);
    await fetchStagesForJobPost(jobPostId, { force: true });
  }

  function setSelectedJobPostIds(ids) {
    selectedJobPostIds.value = ids;
  }

  function setSearch(value) {
    search.value = value;
  }

  function setStageTypeFilter(value) {
    stageTypeFilter.value = value;
  }

  return {
    // State
    jobPosts,
    loadingJobPosts,
    selectedJobPostIds,
    search,
    stageTypeFilter,
    candidates,
    loadingCandidates,
    candidatesError,
    stagesByJobPost,
    loadingStages,
    analytics,
    loadingAnalytics,
    // Getters
    isSingleJobMode,
    activeJobPostId,
    activeJobStages,
    boardColumns,
    filteredCandidates,
    candidatesByColumn,
    stageCountsMap,
    isMoving,
    // Actions
    fetchJobPosts,
    fetchStagesForJobPost,
    fetchCandidates,
    fetchAnalytics,
    refreshBoard,
    moveCandidate,
    createStage,
    renameStage,
    persistStageOrder,
    removeStage,
    setSelectedJobPostIds,
    setSearch,
    setStageTypeFilter,
  };
});
