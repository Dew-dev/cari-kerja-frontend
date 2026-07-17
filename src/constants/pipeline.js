/**
 * Canonical pipeline stage categories used to group candidates from
 * different job posts (which may have their own custom stage labels)
 * into a single, consistent global board.
 *
 * Every stage returned by the backend must carry a `stage_type` matching
 * one of these keys so the frontend can map custom/per-job stages back to
 * a stable column when viewing the global (cross-job) board.
 */
export const CANONICAL_STAGE_TYPES = [
  { type: "applied", i18nKey: "pipeline.stages.applied", color: "blue" },
  { type: "screening", i18nKey: "pipeline.stages.screening", color: "amber" },
  { type: "interview", i18nKey: "pipeline.stages.interview", color: "purple" },
  { type: "offer", i18nKey: "pipeline.stages.offer", color: "teal" },
  { type: "hired", i18nKey: "pipeline.stages.hired", color: "green" },
  { type: "rejected", i18nKey: "pipeline.stages.rejected", color: "red" },
];

export const STAGE_TYPE_ORDER = CANONICAL_STAGE_TYPES.reduce((acc, stage, index) => {
  acc[stage.type] = index;
  return acc;
}, {});

export function getStageTypeMeta(stageType) {
  return (
    CANONICAL_STAGE_TYPES.find((s) => s.type === stageType) ||
    CANONICAL_STAGE_TYPES.find((s) => s.type === "custom") || {
      type: stageType || "custom",
      i18nKey: "pipeline.stages.custom",
      color: "gray",
    }
  );
}

export const STAGE_COLOR_CLASSES = {
  blue: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    header: "border-blue-300",
  },
  amber: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    header: "border-amber-300",
  },
  purple: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    header: "border-purple-300",
  },
  teal: {
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
    header: "border-teal-300",
  },
  green: {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    header: "border-green-300",
  },
  red: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    header: "border-red-300",
  },
  gray: {
    badge: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
    header: "border-gray-300",
  },
};

export function getStageColorClasses(color) {
  return STAGE_COLOR_CLASSES[color] || STAGE_COLOR_CLASSES.gray;
}
