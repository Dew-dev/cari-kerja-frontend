import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getPipelineCandidates,
  getPipelineAnalytics,
  getRecruiterJobPosts,
  getJobStages,
  getJobApplicants,
  createJobStage,
  updateJobStage,
  reorderJobStages,
  deleteJobStage,
  moveApplicationStage,
  getApplicationMatch,
  rematchJobPost,
} from "@/services/pipeline.api";
import { CANONICAL_STAGE_TYPES, resolveStageTypeFromStatusName } from "@/constants/pipeline";
import { normalizeMatchFields, shouldApplyMatchUpdate, mergeMatchSources } from "@/constants/matchScore";

// Backend caps `limit` at 100 per request (see candidate_pipeline query_model).
const CANDIDATES_PAGE_LIMIT = 100;
const MAX_CANDIDATE_PAGES = 20; // safety net: up to 2000 candidates on the board

function buildFallbackStages() {
  return CANONICAL_STAGE_TYPES.map((meta, index) => ({
    id: `fallback-${meta.type}`,
    name: meta.type.charAt(0).toUpperCase() + meta.type.slice(1),
    stage_type: meta.type,
    position: index,
    is_system: true,
    color: meta.color,
    isFallback: true,
  }));
}

function mapMatchFields(raw = {}) {
  return normalizeMatchFields(raw);
}

function mapApplicantToCandidate(applicant, jobPostId, stages) {
  const statusName = applicant.status || applicant.stage_name || "";
  const stageType = resolveStageTypeFromStatusName(statusName);
  const statusLower = String(statusName).trim().toLowerCase();
  const stage =
    stages.find((s) => String(s.name || "").trim().toLowerCase() === statusLower) ||
    stages.find((s) => s.id && String(s.id) === String(applicant.application_status_id || applicant.stage_id || "")) ||
    stages.find((s) => s.stage_type === stageType) ||
    stages.find((s) => s.stage_type === "applied") ||
    stages[0];

  // Prefer explicit worker profile id — never fall back to user_id / application_id
  const workerId =
    applicant.worker?.id ||
    applicant.worker_id ||
    (applicant.id && applicant.id !== applicant.application_id ? applicant.id : null);

  return {
    application_id: applicant.application_id,
    worker_id: workerId,
    user_id: applicant.user_id || applicant.worker?.user_id || null,
    name: applicant.name,
    email: applicant.email,
    avatar_url: applicant.avatar_url || null,
    job_post_id: jobPostId,
    job_post_title: null,
    stage_id: stage?.id ?? null,
    stage_name: stage?.name || statusName,
    stage_type: stage?.stage_type || stageType,
    applied_at: applicant.applied_at,
    updated_at: applicant.applied_at,
    resume_url: applicant.resume_url,
    cover_letter: applicant.cover_letter,
    ...mapMatchFields(applicant),
  };
}

function normalizePipelineCandidate(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const applicationId = raw.application_id || raw.application?.id || null;
  const workerId =
    raw.worker?.id ||
    raw.worker_id ||
    raw.worker_profile_id ||
    (raw.id && raw.id !== applicationId ? raw.id : null);

  return {
    ...raw,
    application_id: applicationId,
    worker_id: workerId,
    user_id: raw.user_id || raw.worker?.user_id || null,
    job_post_id: raw.job_post_id || raw.job_post?.id || null,
    name: raw.name || raw.worker?.name || raw.applicant_name,
    avatar_url: raw.avatar_url || raw.worker?.avatar_url || null,
    ...mapMatchFields(raw),
  };
}

function compareCandidates(a, b, sortBy, sortOrder) {
  const dir = sortOrder === "asc" ? 1 : -1;
  let delta = 0;

  if (sortBy === "match_score") {
    const sa = a.match_score == null ? -1 : Number(a.match_score);
    const sb = b.match_score == null ? -1 : Number(b.match_score);
    delta = sa - sb;
  } else if (sortBy === "applied_at") {
    delta = new Date(a.applied_at || 0).getTime() - new Date(b.applied_at || 0).getTime();
  } else {
    // updated_at (default secondary)
    delta = new Date(a.updated_at || a.applied_at || 0).getTime() - new Date(b.updated_at || b.applied_at || 0).getTime();
  }

  if (delta === 0) {
    // Stable tie-breaker: higher match first, then name
    const sa = a.match_score == null ? -1 : Number(a.match_score);
    const sb = b.match_score == null ? -1 : Number(b.match_score);
    if (sa !== sb) return sb - sa;
    return String(a.name || "").localeCompare(String(b.name || ""));
  }
  return delta * dir;
}

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
  const sortBy = ref("match_score");
  const sortOrder = ref("desc");
  const minMatchScore = ref(null);

  const candidates = ref([]);
  const loadingCandidates = ref(false);
  const candidatesError = ref(null);

  const stagesByJobPost = ref({}); // { [jobPostId]: Stage[] }
  const loadingStages = ref({}); // { [jobPostId]: boolean }
  const stagesError = ref(null);

  const analytics = ref({ stage_counts: [], conversion_rates: [] });
  const loadingAnalytics = ref(false);
  const rematching = ref(false);

  const movingApplicationIds = ref(new Set());

  // Multi-select for bulk communication (application_ids)
  const selectedApplicationIds = ref([]);

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
        isFallback: !!stage.isFallback,
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
      isFallback: false,
    }));
  });

  const usingApplicantsFallback = computed(
    () => !!candidatesError.value && candidates.value.length > 0,
  );

  const usingStagesFallback = computed(() =>
    activeJobStages.value.some((s) => s.isFallback),
  );

  const filteredCandidates = computed(() => {
    let list = candidates.value;

    const query = search.value.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(query) ||
          (c.email || "").toLowerCase().includes(query),
      );
    }

    if (minMatchScore.value != null && minMatchScore.value !== "") {
      const min = Number(minMatchScore.value);
      if (!Number.isNaN(min)) {
        list = list.filter((c) => {
          const score = c.match_score == null ? 0 : Number(c.match_score);
          return score >= min;
        });
      }
    }

    // Always apply client sort so column order stays stable for fallback
    // applicants path and when the API ignores sort params.
    return [...list].sort((a, b) => compareCandidates(a, b, sortBy.value, sortOrder.value));
  });

  const candidatesByColumn = computed(() => {
    const map = {};
    for (const col of boardColumns.value) map[col.key] = [];

    // In per-job mode, a candidate's `stage_id` should always match one of
    // this job's own stages. It can fail to match for legacy applications
    // that still carry the old global status template id (from before
    // stages became per-job) — without a fallback those candidates would
    // silently vanish from every column. Reconcile by `stage_type` first,
    // then fall back to the job's first (lowest position) stage.
    const columnKeyByStageType = {};
    if (isSingleJobMode.value) {
      for (const col of boardColumns.value) {
        if (!(col.stage_type in columnKeyByStageType)) columnKeyByStageType[col.stage_type] = col.key;
      }
    }

    for (const candidate of filteredCandidates.value) {
      let key = isSingleJobMode.value ? String(candidate.stage_id) : candidate.stage_type;

      if (isSingleJobMode.value && !(key in map)) {
        key = columnKeyByStageType[candidate.stage_type] ?? boardColumns.value[0]?.key;
      }

      if (key === undefined || key === null) continue;
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

    // When analytics is unavailable (or empty), derive counts from the board
    // so the summary strip matches the visible cards.
    if (!Object.keys(map).length) {
      for (const [key, list] of Object.entries(candidatesByColumn.value)) {
        map[key] = list.length;
      }
    }
    return map;
  });

  const isMoving = computed(() => (applicationId) => movingApplicationIds.value.has(applicationId));

  const selectedCandidates = computed(() => {
    const idSet = new Set(selectedApplicationIds.value.map(String));
    return filteredCandidates.value.filter((c) => idSet.has(String(c.application_id)));
  });

  const selectedCount = computed(() => selectedApplicationIds.value.length);

  const selectedStageTypes = computed(() => {
    const types = new Set(selectedCandidates.value.map((c) => c.stage_type).filter(Boolean));
    return [...types];
  });

  /** True when every selected candidate shares the same stage (required for bulk send). */
  const selectionIsSingleStage = computed(() => selectedStageTypes.value.length <= 1);

  function isCandidateSelected(applicationId) {
    return selectedApplicationIds.value.some((id) => String(id) === String(applicationId));
  }

  function toggleCandidateSelection(applicationId) {
    const key = String(applicationId);
    if (isCandidateSelected(key)) {
      selectedApplicationIds.value = selectedApplicationIds.value.filter((id) => String(id) !== key);
    } else {
      selectedApplicationIds.value = [...selectedApplicationIds.value, applicationId];
    }
  }

  function selectCandidatesInColumn(columnKey) {
    const list = candidatesByColumn.value[columnKey] || [];
    const ids = list.map((c) => c.application_id);
    const idSet = new Set(selectedApplicationIds.value.map(String));
    for (const id of ids) idSet.add(String(id));
    // Preserve original id types from candidates where possible
    const byId = new Map(filteredCandidates.value.map((c) => [String(c.application_id), c.application_id]));
    selectedApplicationIds.value = [...idSet].map((k) => byId.get(k) ?? k);
  }

  function clearCandidateSelection() {
    selectedApplicationIds.value = [];
  }

  function setColumnSelection(columnKey, selected) {
    const list = candidatesByColumn.value[columnKey] || [];
    const columnIds = new Set(list.map((c) => String(c.application_id)));
    if (selected) {
      selectCandidatesInColumn(columnKey);
    } else {
      selectedApplicationIds.value = selectedApplicationIds.value.filter(
        (id) => !columnIds.has(String(id)),
      );
    }
  }

  function isColumnFullySelected(columnKey) {
    const list = candidatesByColumn.value[columnKey] || [];
    if (!list.length) return false;
    return list.every((c) => isCandidateSelected(c.application_id));
  }

  function isColumnPartiallySelected(columnKey) {
    const list = candidatesByColumn.value[columnKey] || [];
    if (!list.length) return false;
    const count = list.filter((c) => isCandidateSelected(c.application_id)).length;
    return count > 0 && count < list.length;
  }

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
      const stages = Array.isArray(res.data?.data) ? res.data.data : [];
      // Empty / 204-style success still leaves the board unusable — use canonical fallback.
      if (!stages.length) {
        const fallback = buildFallbackStages();
        stagesByJobPost.value = { ...stagesByJobPost.value, [jobPostId]: fallback };
        stagesError.value = new Error("Empty stages response");
        return fallback;
      }
      stagesByJobPost.value = { ...stagesByJobPost.value, [jobPostId]: stages };
      stagesError.value = null;
      return stages;
    } catch (err) {
      console.error("[Pipeline] Failed to fetch stages for job post:", jobPostId, err);
      stagesError.value = err;
      // Staging / older backends may not expose /stages yet — fall back to the
      // canonical 6-column board so candidates can still be displayed.
      const fallback = buildFallbackStages();
      stagesByJobPost.value = { ...stagesByJobPost.value, [jobPostId]: fallback };
      return fallback;
    } finally {
      loadingStages.value = { ...loadingStages.value, [jobPostId]: false };
    }
  }

  function buildFilterParams() {
    const params = {};
    if (selectedJobPostIds.value.length) params.job_post_id = selectedJobPostIds.value.join(",");
    if (search.value.trim()) params.search = search.value.trim();
    if (stageTypeFilter.value) params.stage_type = stageTypeFilter.value;
    if (sortBy.value) params.sort = sortBy.value;
    if (sortOrder.value) params.order = sortOrder.value;
    if (minMatchScore.value != null && minMatchScore.value !== "") {
      params.min_match_score = Number(minMatchScore.value);
    }
    return params;
  }

  /** Analytics schema only accepts job_post_id (+ recruiter_id server-side). */
  function buildAnalyticsParams() {
    const params = {};
    if (selectedJobPostIds.value.length) params.job_post_id = selectedJobPostIds.value.join(",");
    return params;
  }

  function extractListPayload(res) {
    const body = res?.data;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body)) return body;
    return [];
  }

  async function fetchPipelineCandidatePages(filters) {
    const allCandidates = [];
    let page = 1;
    let totalPage = 1;

    do {
      const res = await getPipelineCandidates({ ...filters, page, limit: CANDIDATES_PAGE_LIMIT });
      allCandidates.push(...extractListPayload(res).map(normalizePipelineCandidate));
      totalPage = res.data?.meta?.totalPage || res.data?.meta?.total_page || 1;
      page += 1;
    } while (page <= totalPage && page <= MAX_CANDIDATE_PAGES);

    return allCandidates;
  }

  async function fetchCandidatesFromApplicantsFallback(jobPostId) {
    const stages = await fetchStagesForJobPost(jobPostId);
    const res = await getJobApplicants(jobPostId);
    const applicants = extractListPayload(res);
    return applicants.map((a) => mapApplicantToCandidate(a, jobPostId, stages));
  }

  async function fetchCandidates() {
    try {
      loadingCandidates.value = true;
      candidatesError.value = null;

      // The backend caps `limit` at 100 per request, so the board is
      // populated by walking through pages until everything is fetched
      // (bounded by MAX_CANDIDATE_PAGES as a sane safety net).
      const filters = buildFilterParams();

      try {
        candidates.value = await fetchPipelineCandidatePages(filters);
      } catch (pipelineErr) {
        // Dedicated pipeline endpoint is missing on some hosts (e.g. staging
        // 404). Fall back to the per-job applicants list that already works.
        // Also retry once without match sort/filter if those params cause 400
        // on an older API build.
        const status = pipelineErr?.response?.status;
        const usedMatchParams =
          filters.sort === "match_score" || filters.min_match_score != null;

        if (status === 400 && usedMatchParams) {
          try {
            const safeFilters = { ...filters };
            delete safeFilters.sort;
            delete safeFilters.order;
            delete safeFilters.min_match_score;
            candidates.value = await fetchPipelineCandidatePages(safeFilters);
          } catch (retryErr) {
            console.warn("[Pipeline] pipeline/candidates unavailable, using applicants fallback:", retryErr);
            candidatesError.value = retryErr;
            if (isSingleJobMode.value && activeJobPostId.value) {
              candidates.value = await fetchCandidatesFromApplicantsFallback(activeJobPostId.value);
            } else {
              candidates.value = [];
              throw retryErr;
            }
          }
        } else {
          console.warn("[Pipeline] pipeline/candidates unavailable, using applicants fallback:", pipelineErr);
          candidatesError.value = pipelineErr;

          if (isSingleJobMode.value && activeJobPostId.value) {
            candidates.value = await fetchCandidatesFromApplicantsFallback(activeJobPostId.value);
          } else {
            candidates.value = [];
            throw pipelineErr;
          }
        }
      }

      // Analytics can report applicants while pipeline/candidates returns an
      // empty 200/204 (e.g. stricter JOINs). Prefer the applicants list then.
      if (
        candidates.value.length === 0 &&
        isSingleJobMode.value &&
        activeJobPostId.value
      ) {
        try {
          const fallback = await fetchCandidatesFromApplicantsFallback(activeJobPostId.value);
          if (fallback.length > 0) {
            console.warn(
              "[Pipeline] pipeline/candidates returned empty; using applicants fallback",
            );
            candidates.value = fallback;
            candidatesError.value = candidatesError.value || new Error("Empty pipeline candidates");
          }
        } catch (fallbackErr) {
          console.warn("[Pipeline] applicants fallback failed:", fallbackErr);
        }
      }

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
      candidates.value = [];
    } finally {
      loadingCandidates.value = false;
    }
  }

  async function fetchAnalytics() {
    try {
      loadingAnalytics.value = true;
      const res = await getPipelineAnalytics(buildAnalyticsParams());
      analytics.value = res.data?.data || { stage_counts: [], conversion_rates: [] };
    } catch (err) {
      console.error("[Pipeline] Failed to fetch analytics:", err);
      analytics.value = { stage_counts: [], conversion_rates: [] };
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

    // Fallback stages (used when /stages is unavailable) are not real DB ids.
    if (String(targetStageId).startsWith("fallback-") || column.isFallback) {
      const err = new Error("Pipeline stages API is unavailable on this environment");
      err.code = "PIPELINE_STAGES_UNAVAILABLE";
      throw err;
    }

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

  /**
   * Move every selected candidate into the given board column.
   * Candidates already in that stage are skipped.
   */
  async function moveSelectedCandidates(column) {
    const list = selectedCandidates.value.slice();
    if (!list.length || !column) return { moved: 0, skipped: 0, failed: 0 };

    let moved = 0;
    let skipped = 0;
    let failed = 0;

    for (const candidate of list) {
      const targetStageId = resolveTargetStageId(candidate, column);
      if (!targetStageId || String(targetStageId) === String(candidate.stage_id)) {
        skipped += 1;
        continue;
      }
      try {
        await moveCandidate(candidate, column);
        moved += 1;
      } catch {
        failed += 1;
      }
    }

    clearCandidateSelection();
    return { moved, skipped, failed };
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
    clearCandidateSelection();
  }

  function setSearch(value) {
    search.value = value;
  }

  function setStageTypeFilter(value) {
    stageTypeFilter.value = value;
  }

  function setSortBy(value) {
    sortBy.value = value || "match_score";
  }

  function setSortOrder(value) {
    sortOrder.value = value === "asc" ? "asc" : "desc";
  }

  function setMinMatchScore(value) {
    if (value === "" || value === null || value === undefined) {
      minMatchScore.value = null;
      return;
    }
    const n = Number(value);
    minMatchScore.value = Number.isNaN(n) ? null : Math.min(100, Math.max(0, n));
  }

  function applyMatchToCandidate(applicationId, matchPayload, { force = false } = {}) {
    const idx = candidates.value.findIndex(
      (c) => String(c.application_id) === String(applicationId),
    );
    if (idx === -1) return null;

    const mapped = mapMatchFields(matchPayload || {});
    const current = candidates.value[idx];
    if (!force && !shouldApplyMatchUpdate(mapped, current)) {
      return current;
    }

    const merged = mergeMatchSources(current, mapped);
    candidates.value[idx] = { ...current, ...merged };
    return candidates.value[idx];
  }

  async function fetchApplicationMatch(applicationId) {
    const res = await getApplicationMatch(applicationId);
    const data = res.data?.data || res.data || {};
    const mapped = mapMatchFields(data);
    applyMatchToCandidate(applicationId, mapped);
    return mapped;
  }

  async function rematchActiveJob() {
    const jobId = activeJobPostId.value;
    if (!jobId) throw new Error("No active job post");

    rematching.value = true;
    try {
      const res = await rematchJobPost(jobId);
      // Do not clear scores — workers recompute async; board refreshes after enqueue.
      return res.data?.data || res.data || { enqueued: true };
    } finally {
      rematching.value = false;
    }
  }

  return {
    // State
    jobPosts,
    loadingJobPosts,
    selectedJobPostIds,
    search,
    stageTypeFilter,
    sortBy,
    sortOrder,
    minMatchScore,
    candidates,
    loadingCandidates,
    candidatesError,
    stagesByJobPost,
    loadingStages,
    analytics,
    loadingAnalytics,
    rematching,
    selectedApplicationIds,
    // Getters
    isSingleJobMode,
    activeJobPostId,
    activeJobStages,
    boardColumns,
    filteredCandidates,
    candidatesByColumn,
    stageCountsMap,
    isMoving,
    usingApplicantsFallback,
    usingStagesFallback,
    selectedCandidates,
    selectedCount,
    selectedStageTypes,
    selectionIsSingleStage,
    // Actions
    fetchJobPosts,
    fetchStagesForJobPost,
    fetchCandidates,
    fetchAnalytics,
    refreshBoard,
    moveCandidate,
    moveSelectedCandidates,
    createStage,
    renameStage,
    persistStageOrder,
    removeStage,
    setSelectedJobPostIds,
    setSearch,
    setStageTypeFilter,
    setSortBy,
    setSortOrder,
    setMinMatchScore,
    fetchApplicationMatch,
    rematchActiveJob,
    isCandidateSelected,
    toggleCandidateSelection,
    selectCandidatesInColumn,
    clearCandidateSelection,
    setColumnSelection,
    isColumnFullySelected,
    isColumnPartiallySelected,
  };
});
