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
