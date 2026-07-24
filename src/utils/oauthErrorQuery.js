import { push } from "notivue";

const OAUTH_ERROR_QUERY_KEYS = ["error", "provider", "message"];

/**
 * Decode BE `message` query (URL-encoded). Safe if already decoded.
 * @param {unknown} raw
 * @returns {string}
 */
export function decodeOAuthErrorMessage(raw) {
  if (typeof raw !== "string" || !raw) return "";
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

/**
 * Resolve i18n key for OAuth error redirect contract.
 * @param {string} error
 * @param {string} [provider]
 * @returns {string|null}
 */
export function resolveOAuthErrorI18nKey(error, provider) {
  const code = String(error || "").trim();
  if (!code) return null;

  if (code === "oauth_failed") {
    return "auth.oauth.failed";
  }

  if (code === "provider_conflict") {
    const p = String(provider || "").trim().toLowerCase();
    if (p === "local" || p === "google" || p === "telegram") {
      return `auth.oauth.providerConflict.${p}`;
    }
    return "auth.oauth.providerConflict.default";
  }

  return "auth.oauth.failed";
}

/**
 * Show OAuth error toast from route query, then strip error params from URL.
 * Does NOT treat this as session expired / does not logout.
 *
 * @param {{ route: import('vue-router').RouteLocationNormalizedLoaded, router: import('vue-router').Router, t: Function, te?: Function }} opts
 * @returns {boolean} true if an error query was consumed
 */
export function consumeOAuthErrorQuery({ route, router, t, te }) {
  const error = route.query.error;
  if (!error || Array.isArray(error)) return false;

  const provider = Array.isArray(route.query.provider)
    ? route.query.provider[0]
    : route.query.provider;
  const messageRaw = Array.isArray(route.query.message)
    ? route.query.message[0]
    : route.query.message;
  const backendMessage = decodeOAuthErrorMessage(messageRaw);

  const i18nKey = resolveOAuthErrorI18nKey(error, provider);
  let text = "";

  if (i18nKey && typeof te === "function" && te(i18nKey)) {
    text = t(i18nKey);
  } else if (i18nKey) {
    const translated = t(i18nKey);
    // vue-i18n returns the key when missing
    text = translated !== i18nKey ? translated : "";
  }

  if (!text) {
    text = backendMessage || t("auth.oauth.failed");
  }

  push.error(text);

  const nextQuery = { ...route.query };
  for (const key of OAUTH_ERROR_QUERY_KEYS) {
    delete nextQuery[key];
  }

  router.replace({ path: route.path, query: nextQuery });
  return true;
}
