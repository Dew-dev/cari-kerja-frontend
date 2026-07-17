/**
 * Canonical pipeline stage categories used to group candidates from
 * different job posts (which may have their own custom stage labels)
 * into a single, consistent global board.
 *
 * Every stage returned by the backend must carry a `stage_type` matching
 * one of these keys so the frontend can map custom/per-job stages back to
 * a stable column when viewing the global (cross-job) board.
 *
 * Colors mirror the hex values the backend seeds by default (see
 * `018_candidate_pipeline.sql` / `candidate_pipeline` module) so the global
 * (virtual) columns visually match the real per-job stages.
 */
export const CANONICAL_STAGE_TYPES = [
  { type: "applied", i18nKey: "pipeline.stages.applied", color: "#64748B" },
  { type: "screening", i18nKey: "pipeline.stages.screening", color: "#3B82F6" },
  { type: "interview", i18nKey: "pipeline.stages.interview", color: "#F59E0B" },
  { type: "offer", i18nKey: "pipeline.stages.offer", color: "#8B5CF6" },
  { type: "hired", i18nKey: "pipeline.stages.hired", color: "#22C55E" },
  { type: "rejected", i18nKey: "pipeline.stages.rejected", color: "#EF4444" },
];

export const STAGE_TYPE_ORDER = CANONICAL_STAGE_TYPES.reduce((acc, stage, index) => {
  acc[stage.type] = index;
  return acc;
}, {});

const STAGE_TYPE_COLOR_FALLBACK = CANONICAL_STAGE_TYPES.reduce((acc, stage) => {
  acc[stage.type] = stage.color;
  return acc;
}, { custom: "#6B7280" });

export function getStageTypeMeta(stageType) {
  return (
    CANONICAL_STAGE_TYPES.find((s) => s.type === stageType) || {
      type: stageType || "custom",
      i18nKey: "pipeline.stages.custom",
      color: STAGE_TYPE_COLOR_FALLBACK.custom,
    }
  );
}

/**
 * Map legacy global status names (APPLIED / IN_REVIEW / …) and the newer
 * seeded display names (Applied / Screening / …) onto a canonical stage_type.
 * Used when falling back to GET /job-posts/:id/applicants which only returns
 * `status` as a name string.
 */
export function resolveStageTypeFromStatusName(statusName) {
  const normalized = String(statusName || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  const legacyMap = {
    APPLIED: "applied",
    IN_REVIEW: "screening",
    SCREENING: "screening",
    SHORTLISTED: "interview",
    INTERVIEW: "interview",
    OFFER: "offer",
    HIRED: "hired",
    REJECTED: "rejected",
  };

  if (legacyMap[normalized]) return legacyMap[normalized];

  const lower = String(statusName || "").trim().toLowerCase();
  const byCanonical = CANONICAL_STAGE_TYPES.find((s) => s.type === lower);
  return byCanonical?.type || "applied";
}

/**
 * Resolve the display color for a stage/column: prefer the explicit hex
 * color coming from the backend (`stage.color`), falling back to the
 * canonical color for its `stage_type` (e.g. freshly created custom stages
 * have `color: null` until the recruiter picks one).
 */
export function resolveStageColor(stageOrColumn) {
  return (
    stageOrColumn?.color ||
    STAGE_TYPE_COLOR_FALLBACK[stageOrColumn?.stage_type] ||
    STAGE_TYPE_COLOR_FALLBACK.custom
  );
}

function hexToRgba(hex, alpha) {
  const clean = (hex || "").replace("#", "");
  const isShort = clean.length === 3;
  const r = parseInt(isShort ? clean[0] + clean[0] : clean.substring(0, 2), 16);
  const g = parseInt(isShort ? clean[1] + clean[1] : clean.substring(2, 4), 16);
  const b = parseInt(isShort ? clean[2] + clean[2] : clean.substring(4, 6), 16);

  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(107, 114, 128, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Build inline-style objects for the common stage color treatments used
 * across the pipeline UI (dot indicator, soft badge, column header accent).
 */
export function getStageColorStyles(color) {
  const resolved = color || STAGE_TYPE_COLOR_FALLBACK.custom;
  return {
    dot: { backgroundColor: resolved },
    badge: {
      backgroundColor: hexToRgba(resolved, 0.12),
      color: resolved,
      borderColor: hexToRgba(resolved, 0.35),
    },
    header: { borderColor: hexToRgba(resolved, 0.5) },
  };
}
