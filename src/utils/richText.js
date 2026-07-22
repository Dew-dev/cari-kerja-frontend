import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "code",
  "pre",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class"];

export function stripHtml(html = "") {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  return (doc.body.textContent || "").replace(/\u00a0/g, " ").trim();
}

export function isEmptyHtml(html = "") {
  return stripHtml(html).length === 0;
}

export function countWordsHtml(html = "") {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function sanitizeHtml(html = "") {
  if (!html) return "";
  return DOMPurify.sanitize(String(html), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
