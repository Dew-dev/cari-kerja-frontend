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
  "img",
  "hr",
  "mark",
  "span",
  "div",
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "class",
  "style",
  "src",
  "alt",
  "title",
];

/** Safe inline style properties for editor formatting (color / align / weight). */
const SAFE_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "text-align",
  "font-weight",
  "font-style",
  "text-decoration",
]);

const DANGEROUS_STYLE_VALUE =
  /expression\s*\(|url\s*\(|@import|javascript:|vbscript:|-moz-binding/i;

let hooksRegistered = false;

/**
 * Allow http(s), root-relative paths, and simple relative paths.
 * Reject javascript:, protocol-relative //, and non-image / svg data URIs.
 */
export function isSafeImageSrc(src = "") {
  const value = String(src || "").trim();
  if (!value) return false;

  const lower = value.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("blob:")
  ) {
    return false;
  }

  // Protocol-relative URLs are ambiguous — reject.
  if (value.startsWith("//")) return false;

  if (lower.startsWith("data:")) {
    return /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value);
  }

  if (/^https?:\/\//i.test(value)) return true;

  // Root-relative or extension-relative path without a scheme.
  if (value.startsWith("/")) return true;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return true;

  return false;
}

export function sanitizeInlineStyle(raw = "") {
  if (!raw) return "";

  return String(raw)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf(":");
      if (idx === -1) return null;

      const prop = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      if (!SAFE_STYLE_PROPS.has(prop) || !val) return null;
      if (DANGEROUS_STYLE_VALUE.test(val)) return null;

      return `${prop}: ${val}`;
    })
    .filter(Boolean)
    .join("; ");
}

function ensureSanitizerHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;

  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName === "style") {
      const cleaned = sanitizeInlineStyle(data.attrValue);
      if (!cleaned) {
        data.keepAttr = false;
      } else {
        data.attrValue = cleaned;
      }
      return;
    }

    if (data.attrName === "src" && node.tagName === "IMG") {
      if (!isSafeImageSrc(data.attrValue)) {
        data.keepAttr = false;
      }
    }
  });

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (/^\s*(javascript|vbscript|data):/i.test(href)) {
        node.removeAttribute("href");
      }
      node.setAttribute("rel", "noopener noreferrer");
      if (!node.getAttribute("target")) {
        // keep in-app links same-tab; external can set target in content
      }
    }

    if (node.tagName === "IMG") {
      const src = node.getAttribute("src");
      if (!isSafeImageSrc(src)) {
        node.removeAttribute("src");
      }
    }
  });
}

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
  ensureSanitizerHooks();
  return DOMPurify.sanitize(String(html), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}
