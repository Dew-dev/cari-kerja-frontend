/** Match score color tokens for pipeline cards / drawer (avoid purple). */
export function getMatchScoreTone(score) {
  const n = Number(score);
  if (Number.isNaN(n)) {
    return {
      badge: "bg-gray-100 text-gray-600 border-gray-200",
      bar: "bg-gray-300",
      text: "text-gray-600",
    };
  }
  if (n >= 80) {
    return {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      bar: "bg-emerald-500",
      text: "text-emerald-700",
    };
  }
  if (n >= 60) {
    return {
      badge: "bg-teal-50 text-teal-700 border-teal-200",
      bar: "bg-teal-500",
      text: "text-teal-700",
    };
  }
  if (n >= 40) {
    return {
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      bar: "bg-amber-500",
      text: "text-amber-800",
    };
  }
  return {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    bar: "bg-rose-400",
    text: "text-rose-700",
  };
}

function parseJsonField(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

/** Normalize match payload from pipeline list, applicants, or GET .../match. */
export function normalizeMatchFields(raw = {}) {
  const scoreRaw = raw.match_score;
  const score =
    scoreRaw === null || scoreRaw === undefined || scoreRaw === ""
      ? null
      : Number(scoreRaw);

  const breakdownRaw = parseJsonField(raw.match_breakdown, null);
  const breakdown =
    breakdownRaw && typeof breakdownRaw === "object" && !Array.isArray(breakdownRaw)
      ? breakdownRaw
      : null;

  const reasonsRaw = parseJsonField(raw.match_reasons, []);
  const reasons = Array.isArray(reasonsRaw) ? reasonsRaw : [];

  return {
    match_score: score != null && !Number.isNaN(score) ? score : null,
    match_status: raw.match_status || (score == null ? "pending" : "ready"),
    match_computed_at: raw.match_computed_at || raw.computed_at || null,
    match_breakdown: breakdown,
    match_reasons: reasons,
  };
}

/**
 * Merge list-card match fields with optional GET /match detail.
 * Prefer API enrichment, but do not let a pending stub wipe a known score.
 */
export function mergeMatchSources(listCandidate = {}, apiMatch = null) {
  const fromList = normalizeMatchFields(listCandidate || {});
  if (!apiMatch) return fromList;

  const fromApi = normalizeMatchFields(apiMatch);
  if (!shouldApplyMatchUpdate(fromApi, fromList)) {
    return fromList;
  }

  const apiHasScore = fromApi.match_score != null;
  const apiHasBreakdown = !!fromApi.match_breakdown;
  const apiHasReasons = fromApi.match_reasons.length > 0;

  return {
    match_score: apiHasScore ? fromApi.match_score : fromList.match_score,
    match_status: fromApi.match_status || fromList.match_status,
    match_computed_at: fromApi.match_computed_at || fromList.match_computed_at,
    match_breakdown: apiHasBreakdown ? fromApi.match_breakdown : fromList.match_breakdown,
    match_reasons: apiHasReasons ? fromApi.match_reasons : fromList.match_reasons,
  };
}

/** True when incoming match data should replace what we already show. */
export function shouldApplyMatchUpdate(incoming, current) {
  const next = normalizeMatchFields(incoming || {});
  const prev = normalizeMatchFields(current || {});

  const nextEmpty =
    next.match_score == null &&
    !next.match_breakdown &&
    next.match_reasons.length === 0 &&
    (next.match_status === "pending" || !next.match_status);

  const prevHasData =
    prev.match_score != null ||
    !!prev.match_breakdown ||
    prev.match_reasons.length > 0 ||
    prev.match_status === "ready" ||
    prev.match_status === "insufficient_data" ||
    prev.match_status === "failed";

  // Empty pending stub must never wipe scored / detailed match state.
  if (nextEmpty && prevHasData) return false;
  return true;
}
